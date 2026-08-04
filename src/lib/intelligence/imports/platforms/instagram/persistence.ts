import type { ImportBatch, ImportIssue, PersistenceReceipt } from "@/lib/intelligence/imports/types";
import type { ImportPersistence } from "@/lib/intelligence/imports/contracts";
import type { InstagramAudienceNormalizedRecord } from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";
import type { IntelligenceMetricCreate } from "@/lib/types/intelligence";
import { INSTAGRAM_AUDIENCE_DATASET_NAME } from "@/lib/intelligence/audience/summary";
import {
  createImport,
  finalizeImport,
  findOrCreateDataset,
  insertMetrics,
} from "@/lib/services/intelligenceDatasetService";

/**
 * Implementação de `ImportPersistence` (`imports/contracts.ts`) para a
 * audiência do Instagram — segue a recomendação de
 * `docs/intelligence/AUDIENCE_PERSISTENCE.md` (Sprint 14): os 4 formatos
 * (FollowerHistory, FollowerActivity, FollowerGender, FollowerTopTerritories)
 * não têm um item individual identificável, então nenhum `Content` é
 * criado — cada registro normalizado vira uma ou mais linhas de `Metric`
 * associadas direto ao Dataset (`content_id` ausente), reaproveitando
 * exatamente o mesmo caminho já suportado por `intelligenceDatasetService.ts`
 * desde a Sprint 6 (`content_id` sempre foi opcional).
 *
 * Um único Dataset (`platform: "instagram"`) cobre os 4 formatos — eles não
 * competem pela mesma identidade de dado, só diferem na convenção de `key`
 * de cada `Metric` (`toMetricRows` abaixo). Isso significa que esta sprint
 * não precisa de `(platform, kind)`: ver `AUDIENCE_PERSISTENCE.md` seção 1.1
 * e seção 4 para quando essa chave composta vai ser de fato necessária.
 */

function failureReceipt(batchId: string, rejectedRecords: number, message: string): PersistenceReceipt {
  return {
    batchId,
    status: "failed",
    acceptedRecords: 0,
    rejectedRecords,
    issues: [{ stage: "persist", code: "instagram-audience-persistence-failed", message }],
  };
}

/**
 * Converte um `NormalizedImportRecord` do Instagram (um dos 4 `datasetKind`)
 * em uma ou mais `IntelligenceMetricCreate` — sempre sem `content_id`. A
 * dimensão temporal vira `measured_at` (a data/hora real do dado, quando
 * existe) e a dimensão categórica (gênero, território) vira parte da `key`,
 * já que a tabela `intelligence_metrics` não tem uma coluna de dimensão
 * própria (mesmo trade-off documentado em `AUDIENCE_PERSISTENCE.md` seção
 * 1.2/3.1: aceitável para não precisar de nenhuma migration nesta sprint).
 *
 * `audience_demographics`/`audience_territories` são retratos ("snapshots")
 * sem data própria no arquivo — usam `batch.createdAt` como o instante da
 * medição, mesma convenção que o YouTube já usa para métricas sem uma data
 * mais específica que a do próprio Import.
 */
function toMetricRows(
  record: InstagramAudienceNormalizedRecord,
  params: { datasetId: string; importId: string; batchCreatedAt: string }
): IntelligenceMetricCreate[] {
  const { datasetId, importId, batchCreatedAt } = params;
  const base = { dataset_id: datasetId, import_id: importId };
  const payload = record.payload;

  switch (payload.datasetKind) {
    case "audience_history": {
      const measuredAt = `${payload.date}T00:00:00.000Z`;
      return [
        { ...base, key: "followers", value: payload.followers, unit: "count", measured_at: measuredAt },
        { ...base, key: "followersDelta", value: payload.followersDelta, unit: "count", measured_at: measuredAt },
      ];
    }
    case "audience_activity": {
      const hour = String(payload.hour).padStart(2, "0");
      return [
        {
          ...base,
          key: "activeFollowers",
          value: payload.activeFollowers,
          unit: "count",
          measured_at: `${payload.date}T${hour}:00:00.000Z`,
        },
      ];
    }
    case "audience_demographics":
      return [
        {
          ...base,
          key: `gender:${payload.label}`,
          value: payload.distribution,
          unit: "ratio",
          measured_at: batchCreatedAt,
        },
      ];
    case "audience_territories":
      return [
        {
          ...base,
          key: `territory:${payload.territory}`,
          value: payload.distribution,
          unit: "ratio",
          measured_at: batchCreatedAt,
        },
      ];
  }
}

export const instagramAudiencePersistence: ImportPersistence<InstagramAudienceNormalizedRecord> = {
  async persist(records: InstagramAudienceNormalizedRecord[], batch: ImportBatch): Promise<PersistenceReceipt> {
    if (records.length === 0) {
      return failureReceipt(batch.id, 0, "Nenhum registro normalizado para importar.");
    }

    const dataset = await findOrCreateDataset({ platform: "instagram", name: INSTAGRAM_AUDIENCE_DATASET_NAME });
    if (!dataset) {
      return failureReceipt(
        batch.id,
        records.length,
        "Não foi possível localizar ou criar o Dataset de audiência do Instagram."
      );
    }

    const fileName = batch.files[0]?.name ?? "arquivo.xlsx";
    const importRow = await createImport({ dataset_id: dataset.id, file_name: fileName });
    if (!importRow) {
      return failureReceipt(batch.id, records.length, "Não foi possível registrar o Import.");
    }

    const issues: ImportIssue[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const record of records) {
      const rows = toMetricRows(record, {
        datasetId: dataset.id,
        importId: importRow.id,
        batchCreatedAt: batch.createdAt,
      });

      const saved = await insertMetrics(rows);
      if (!saved) {
        rejected += 1;
        issues.push({
          stage: "persist",
          code: "instagram-audience-metrics-insert-failed",
          message: `Não foi possível salvar as métricas de audiência (${record.payload.datasetKind}).`,
        });
        continue;
      }

      accepted += 1;
    }

    await finalizeImport({
      id: importRow.id,
      status: accepted > 0 ? "completed" : "failed",
      acceptedRecords: accepted,
      rejectedRecords: rejected,
    });

    return {
      batchId: batch.id,
      status: accepted > 0 ? "persisted" : "failed",
      acceptedRecords: accepted,
      rejectedRecords: rejected,
      issues,
    };
  },
};
