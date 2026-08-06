import type { ImportPersistence } from "@/lib/intelligence/imports/contracts";
import type { TikTokPromotionNormalizedRecord } from "@/lib/intelligence/imports/platforms/tiktok/promotionsParser";
import type { ImportBatch, ImportIssue, PersistenceReceipt } from "@/lib/intelligence/imports/types";
import type { IntelligenceMetricCreate } from "@/lib/types/intelligence";
import {
  createImport,
  finalizeImport,
  findOrCreateDataset,
  insertMetrics,
  upsertContent,
} from "@/lib/services/intelligenceDatasetService";

export const TIKTOK_PROMOTIONS_DATASET_NAME = "TikTok — Promoções";

function failureReceipt(batchId: string, rejectedRecords: number, message: string): PersistenceReceipt {
  return {
    batchId,
    status: "failed",
    acceptedRecords: 0,
    rejectedRecords,
    issues: [{ stage: "persist", code: "tiktok-promotions-persistence-failed", message }],
  };
}

export const tiktokPromotionsPersistence: ImportPersistence<TikTokPromotionNormalizedRecord> = {
  async persist(
    records: TikTokPromotionNormalizedRecord[],
    batch: ImportBatch,
    ownerId: string
  ): Promise<PersistenceReceipt> {
    if (records.length === 0) {
      return failureReceipt(batch.id, 0, "Nenhum registro normalizado para importar.");
    }

    const dataset = await findOrCreateDataset(ownerId, {
      platform: "tiktok",
      name: TIKTOK_PROMOTIONS_DATASET_NAME,
    });
    if (!dataset) {
      return failureReceipt(
        batch.id,
        records.length,
        "Não foi possível localizar ou criar o Dataset de promoções do TikTok."
      );
    }

    const importRow = await createImport({
      dataset_id: dataset.id,
      file_name: batch.files[0]?.name ?? "tiktok-promotions-history.csv",
    });
    if (!importRow) {
      return failureReceipt(batch.id, records.length, "Não foi possível registrar o Import.");
    }

    const issues: ImportIssue[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const record of records) {
      const content = record.payload.title
        ? await upsertContent({ dataset_id: dataset.id, title: record.payload.title })
        : null;

      if (record.payload.title && !content) {
        rejected += 1;
        issues.push({
          stage: "persist",
          code: "tiktok-promotions-content-upsert-failed",
          message: `Não foi possível salvar o conteúdo promovido "${record.payload.title}".`,
        });
        continue;
      }

      const measuredAt = record.payload.measuredAt;
      const rows: IntelligenceMetricCreate[] = Object.entries(record.payload.metrics).map(
        ([key, value]) => ({
          dataset_id: dataset.id,
          import_id: importRow.id,
          ...(content ? { content_id: content.id } : {}),
          key,
          value,
          unit: key === "promo:adCostBrl" ? "BRL" : "count",
          measured_at: measuredAt,
        })
      );

      const saved = await insertMetrics(rows);
      if (!saved) {
        rejected += 1;
        issues.push({
          stage: "persist",
          code: "tiktok-promotions-metrics-insert-failed",
          message: "Não foi possível salvar as métricas da promoção do TikTok.",
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
