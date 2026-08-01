import { randomUUID } from "node:crypto";
import type {
  DetectionResult,
  ImportBatch,
  ImportFileDescriptor,
  ImportFileFormat,
  ImportIssue,
  ParserInput,
} from "@/lib/intelligence/imports/types";
import {
  normalizeYouTubeStudioCsv,
  type YouTubeNormalizedRecord,
} from "@/lib/intelligence/imports/platforms/youtube/parser";

/**
 * Preview em memória do importador do YouTube — etapa "Detection Preview" do
 * fluxo (Arquivo → Detection Preview → Adapter da Plataforma →
 * NormalizedImportRecord). Não persiste nada; apenas parseia, normaliza e
 * resume o CSV do YouTube Studio para exibição em `/admin/intelligence/importacoes`.
 */

export type YouTubeMetricKey = "views" | "watchTimeHours" | "impressions" | "subscribers";

export interface YouTubeMetricSummary {
  key: YouTubeMetricKey;
  label: string;
  total: number;
}

export interface YouTubeImportPreview {
  format: ImportFileFormat;
  confidence: number;
  videoCount: number;
  period: { start: string; end: string } | null;
  metrics: YouTubeMetricSummary[];
  issues: ImportIssue[];
}

const METRIC_LABELS: Record<YouTubeMetricKey, string> = {
  views: "Visualizações",
  watchTimeHours: "Horas assistidas",
  impressions: "Impressões",
  subscribers: "Inscritos (ganho por vídeo)",
};

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizeYouTubeRecords(
  records: readonly YouTubeNormalizedRecord[]
): Pick<YouTubeImportPreview, "videoCount" | "period" | "metrics"> {
  const videoCount = records.length;

  const publishedDates = records.map((record) => record.payload.publishedAt).sort();
  const period = publishedDates.length
    ? { start: publishedDates[0], end: publishedDates[publishedDates.length - 1] }
    : null;

  const totals: Record<YouTubeMetricKey, number> = {
    views: 0,
    watchTimeHours: 0,
    impressions: 0,
    subscribers: 0,
  };

  for (const record of records) {
    totals.views += record.payload.metrics.views;
    totals.watchTimeHours += record.payload.metrics.watchTimeHours;
    totals.impressions += record.payload.metrics.impressions;
    totals.subscribers += record.payload.metrics.subscribers;
  }

  const metrics = (Object.keys(totals) as YouTubeMetricKey[]).map((key) => ({
    key,
    label: METRIC_LABELS[key],
    total: roundToTwoDecimals(totals[key]),
  }));

  return { videoCount, period, metrics };
}

export async function buildYouTubeImportPreview(params: {
  file: ImportFileDescriptor;
  content: string;
  detection: DetectionResult;
}): Promise<YouTubeImportPreview> {
  const batchId = randomUUID();
  const batch: ImportBatch = {
    id: batchId,
    platform: "youtube",
    status: "detected",
    files: [params.file],
    createdAt: new Date().toISOString(),
  };
  const parserInput: ParserInput = {
    batchId,
    platform: "youtube",
    file: params.file,
    payload: params.content,
  };

  const { records, issues } = await normalizeYouTubeStudioCsv({ batch, input: parserInput });
  const { videoCount, period, metrics } = summarizeYouTubeRecords(records);

  return {
    format: params.detection.format,
    confidence: params.detection.confidence,
    videoCount,
    period,
    metrics,
    issues,
  };
}
