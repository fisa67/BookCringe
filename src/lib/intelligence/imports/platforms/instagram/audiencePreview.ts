import { randomUUID } from "node:crypto";
import type {
  DetectionResult,
  ImportBatch,
  ImportFileDescriptor,
  ImportFileFormat,
  ImportIssue,
  ParserInput,
} from "@/lib/intelligence/imports/types";
import { intelligenceFileDetector } from "@/lib/intelligence/imports/detection";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import {
  normalizeInstagramAudienceRows,
} from "@/lib/intelligence/imports/platforms/instagram/audienceParser";
import type {
  InstagramAudienceActivityPayload,
  InstagramAudienceHistoryPayload,
  InstagramAudienceNormalizedRecord,
  InstagramDatasetKind,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

/**
 * Detection Preview + Adapter do Instagram (audiência), em memória — mesmo
 * papel que `platforms/youtube/preview.ts` cumpre para o YouTube, e (desde a
 * Sprint 13 — "Instagram UI Integration") já plugado em `imports/preview.ts`,
 * o dispatcher compartilhado que a UI de Importações chama.
 *
 * Diferente do YouTube (que recebe `content: string` de um CSV), este
 * preview recebe os bytes brutos do `.xlsx` e usa `imports/xlsx.ts` para
 * extrair as linhas antes de detectar/parsear — o resto do fluxo
 * (detecção → Adapter → NormalizedImportRecord → resumo) é o mesmo.
 */

export interface InstagramAudienceMetricSummary {
  key: string;
  label: string;
  total: number;
}

export interface InstagramAudienceKindSummary {
  kind: InstagramDatasetKind;
  recordCount: number;
  /** Presente só para `audience_history`/`audience_activity` (séries com data). */
  period: { start: string; end: string } | null;
}

export interface InstagramAudiencePreview {
  format: ImportFileFormat;
  confidence: number;
  recordCount: number;
  kinds: InstagramAudienceKindSummary[];
  /** "Métricas encontradas" — mesmo papel que `YouTubeImportPreview.metrics`, calculado por `datasetKind` (ver `summarizeInstagramAudienceMetrics`). */
  metrics: InstagramAudienceMetricSummary[];
  records: InstagramAudienceNormalizedRecord[];
  issues: ImportIssue[];
}

export interface InstagramAudiencePreviewReady {
  status: "ready";
  platform: "instagram";
  preview: InstagramAudiencePreview;
}

export interface InstagramAudiencePreviewUnsupported {
  status: "unsupported";
  platform: string;
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export interface InstagramAudiencePreviewFailed {
  status: "failed";
  platform: "instagram";
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export type InstagramAudiencePreviewResult =
  | InstagramAudiencePreviewReady
  | InstagramAudiencePreviewUnsupported
  | InstagramAudiencePreviewFailed;

function isHistoryRecord(
  record: InstagramAudienceNormalizedRecord
): record is InstagramAudienceNormalizedRecord & { payload: InstagramAudienceHistoryPayload } {
  return record.payload.datasetKind === "audience_history";
}

function isActivityRecord(
  record: InstagramAudienceNormalizedRecord
): record is InstagramAudienceNormalizedRecord & { payload: InstagramAudienceActivityPayload } {
  return record.payload.datasetKind === "audience_activity";
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * "Métricas encontradas" da audiência do Instagram — mesmo papel que
 * `summarizeYouTubeRecords` cumpre para o YouTube, mas com um cálculo
 * diferente por `datasetKind` já que cada formato representa um domínio
 * diferente (série temporal vs. distribuição/snapshot):
 *
 * - `audience_history`: seguidores mais recentes (pelo `date` mais alto) e
 *   a variação líquida no período (soma de `followersDelta`).
 * - `audience_activity`: pico e média de seguidores ativos no período.
 * - `audience_demographics`/`audience_territories`: são já um pequeno
 *   conjunto de valores (ex.: Male/Female/Other) — cada linha vira sua
 *   própria métrica, sem agregação.
 *
 * Na prática um único arquivo do Instagram só produz UM `datasetKind` por
 * vez (cada um bate com exatamente um dos 4 schemas), mas a função soma
 * corretamente mesmo se `records` misturar mais de um kind.
 */
export function summarizeInstagramAudienceMetrics(
  records: readonly InstagramAudienceNormalizedRecord[]
): InstagramAudienceMetricSummary[] {
  const metrics: InstagramAudienceMetricSummary[] = [];

  const historyRecords = records.filter(isHistoryRecord);
  if (historyRecords.length > 0) {
    const sorted = [...historyRecords].sort((a, b) => a.payload.date.localeCompare(b.payload.date));
    const latest = sorted[sorted.length - 1];
    const totalDelta = historyRecords.reduce((sum, record) => sum + record.payload.followersDelta, 0);
    metrics.push(
      { key: "followersLatest", label: "Seguidores (mais recente)", total: latest.payload.followers },
      { key: "followersDeltaTotal", label: "Variação de seguidores no período", total: totalDelta }
    );
  }

  const activityRecords = records.filter(isActivityRecord);
  if (activityRecords.length > 0) {
    const values = activityRecords.map((record) => record.payload.activeFollowers);
    const peak = Math.max(...values);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    metrics.push(
      { key: "activeFollowersPeak", label: "Pico de seguidores ativos", total: peak },
      { key: "activeFollowersAverage", label: "Média de seguidores ativos", total: roundToTwoDecimals(average) }
    );
  }

  for (const record of records) {
    if (record.payload.datasetKind === "audience_demographics") {
      metrics.push({ key: `gender:${record.payload.label}`, label: record.payload.label, total: record.payload.distribution });
    }
    if (record.payload.datasetKind === "audience_territories") {
      metrics.push({ key: `territory:${record.payload.territory}`, label: record.payload.territory, total: record.payload.distribution });
    }
  }

  return metrics;
}

function summarizeByKind(records: readonly InstagramAudienceNormalizedRecord[]): InstagramAudienceKindSummary[] {
  const kinds: InstagramDatasetKind[] = ["audience_history", "audience_activity", "audience_demographics", "audience_territories"];

  return kinds
    .map((kind) => {
      const kindRecords = records.filter((record) => record.payload.datasetKind === kind);
      if (kindRecords.length === 0) return null;

      const dates = kindRecords
        .map((record) => (record.payload as { date?: string }).date)
        .filter((date): date is string => Boolean(date))
        .sort();

      return {
        kind,
        recordCount: kindRecords.length,
        period: dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
      };
    })
    .filter((summary): summary is InstagramAudienceKindSummary => summary !== null);
}

/**
 * `referenceDate` é opcional e passa direto para a inferência de ano das
 * datas pt-BR sem ano (`audienceDate.ts`) — por padrão "agora", mas os
 * testes fixam um valor para tornarem o resultado determinístico.
 */
export async function buildInstagramAudiencePreview(params: {
  file: ImportFileDescriptor;
  buffer: ArrayBuffer | Buffer;
  referenceDate?: Date;
}): Promise<InstagramAudiencePreviewResult> {
  const rows = await parseXlsxToRows(params.buffer);
  const [headers] = rows;

  const detection: DetectionResult = await intelligenceFileDetector.detect({
    file: params.file,
    headers,
  });

  if (detection.platform !== "instagram") {
    return {
      status: "unsupported",
      platform: detection.platform,
      format: detection.format,
      confidence: detection.confidence,
      issues: detection.issues,
    };
  }

  const batchId = randomUUID();
  const batch: ImportBatch = {
    id: batchId,
    platform: "instagram",
    status: "detected",
    files: [params.file],
    createdAt: new Date().toISOString(),
  };
  const parserInput: ParserInput = {
    batchId,
    platform: "instagram",
    file: params.file,
    payload: rows,
  };

  const { records, issues } = await normalizeInstagramAudienceRows({
    batch,
    input: parserInput,
    referenceDate: params.referenceDate,
  });

  if (records.length === 0) {
    return {
      status: "failed",
      platform: "instagram",
      format: detection.format,
      confidence: detection.confidence,
      issues: issues.length
        ? issues
        : [
            {
              stage: "parse",
              code: "instagram-audience-no-valid-rows",
              message: "Nenhum registro válido foi encontrado no relatório de audiência do Instagram.",
            },
          ],
    };
  }

  return {
    status: "ready",
    platform: "instagram",
    preview: {
      format: detection.format,
      confidence: detection.confidence,
      recordCount: records.length,
      kinds: summarizeByKind(records),
      metrics: summarizeInstagramAudienceMetrics(records),
      records,
      issues,
    },
  };
}
