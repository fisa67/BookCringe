import type { ImportBatch, ImportIssue, PersistenceReceipt } from "@/lib/intelligence/imports/types";
import type { ImportPersistence } from "@/lib/intelligence/imports/contracts";
import type { YouTubeNormalizedRecord } from "@/lib/intelligence/imports/platforms/youtube/parser";
import {
  createImport,
  finalizeImport,
  findOrCreateDataset,
  insertMetrics,
  upsertContent,
} from "@/lib/services/intelligenceDatasetService";

/**
 * Implementação de `ImportPersistence` (`imports/contracts.ts`) para o
 * YouTube — o único adapter com Detection Preview completa até agora.
 * Mapeia cada `YouTubeNormalizedRecord` (título, data de publicação e as 4
 * métricas do CSV do Studio) para um Content + suas Metrics dentro do
 * Dataset "YouTube Studio — Desempenho de vídeos".
 *
 * Só esta camada sabe que o payload tem `title`/`publishedAt`/`metrics` —
 * a persistência genérica (encontrar/criar Dataset, criar Import, gravar
 * Content/Metric) vive em `intelligenceDatasetService`, agnóstica de
 * plataforma, e será reusada pelos adapters futuros (Instagram, TikTok...).
 */

const YOUTUBE_DATASET_NAME = "YouTube Studio — Desempenho de vídeos";

function failureReceipt(batchId: string, rejectedRecords: number, message: string): PersistenceReceipt {
  return {
    batchId,
    status: "failed",
    acceptedRecords: 0,
    rejectedRecords,
    issues: [{ stage: "persist", code: "youtube-persistence-failed", message }],
  };
}

export const youtubeStudioPersistence: ImportPersistence<YouTubeNormalizedRecord> = {
  async persist(records: YouTubeNormalizedRecord[], batch: ImportBatch, ownerId: string): Promise<PersistenceReceipt> {
    if (records.length === 0) {
      return failureReceipt(batch.id, 0, "Nenhum registro normalizado para importar.");
    }

    const dataset = await findOrCreateDataset(ownerId, { platform: "youtube", name: YOUTUBE_DATASET_NAME });
    if (!dataset) {
      return failureReceipt(
        batch.id,
        records.length,
        "Não foi possível localizar ou criar o Dataset do YouTube."
      );
    }

    const fileName = batch.files[0]?.name ?? "arquivo.csv";
    const importRow = await createImport({ dataset_id: dataset.id, file_name: fileName });
    if (!importRow) {
      return failureReceipt(batch.id, records.length, "Não foi possível registrar o Import.");
    }

    const issues: ImportIssue[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const record of records) {
      const content = await upsertContent({
        dataset_id: dataset.id,
        title: record.payload.title,
        published_at: record.payload.publishedAt,
      });

      if (!content) {
        rejected += 1;
        issues.push({
          stage: "persist",
          code: "youtube-content-upsert-failed",
          message: `Não foi possível salvar o conteúdo "${record.payload.title}".`,
        });
        continue;
      }

      const saved = await insertMetrics(
        Object.entries(record.payload.metrics).map(([key, value]) => ({
          dataset_id: dataset.id,
          import_id: importRow.id,
          content_id: content.id,
          key,
          value,
          measured_at: batch.createdAt,
        }))
      );

      if (!saved) {
        rejected += 1;
        issues.push({
          stage: "persist",
          code: "youtube-metrics-insert-failed",
          message: `Não foi possível salvar as métricas de "${record.payload.title}".`,
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
