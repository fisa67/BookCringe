import type { ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import { EMPTY_IMPORT_SESSION_SUMMARY, type ImportSessionSummary } from "@/lib/intelligence/session/types";

/**
 * Achata o resultado da Detection Preview (`ImportPreviewResult`) no formato
 * que a Import Session guarda — plataforma, confiança, período, quantidade
 * de registros e métricas. Não reprocessa nada: só lê campos que o
 * `previewImportFile` já calculou.
 */
export function summarizeImportPreview(result: ImportPreviewResult): ImportSessionSummary {
  if (result.status === "ready") {
    if (result.platform === "youtube") {
      return {
        platform: result.platform,
        confidence: result.preview.confidence,
        period: result.preview.period,
        recordCount: result.preview.videoCount,
        metrics: result.preview.metrics,
      };
    }

    if (result.platform === "tiktok") {
      return {
        platform: result.platform,
        confidence: result.preview.confidence,
        period: result.preview.period,
        recordCount: result.preview.recordCount,
        metrics: result.preview.metrics,
      };
    }

    return {
      platform: result.platform,
      confidence: result.preview.confidence,
      // Um único arquivo de audiência do Instagram só produz um `datasetKind`
      // por vez — o período (quando existe) fica no resumo desse kind.
      period: result.preview.kinds[0]?.period ?? null,
      recordCount: result.preview.recordCount,
      metrics: result.preview.metrics,
    };
  }

  return {
    ...EMPTY_IMPORT_SESSION_SUMMARY,
    platform: result.platform,
    confidence: result.confidence,
  };
}
