import { randomUUID } from "node:crypto";
import {
  normalizeTikTokPromotionsCsv,
  type TikTokPromotionMetricKey,
  type TikTokPromotionNormalizedRecord,
} from "@/lib/intelligence/imports/platforms/tiktok/promotionsParser";
import type {
  DetectionResult,
  ImportBatch,
  ImportFileDescriptor,
  ImportFileFormat,
  ImportIssue,
  ParserInput,
} from "@/lib/intelligence/imports/types";

export interface TikTokPromotionMetricSummary {
  key: TikTokPromotionMetricKey;
  label: string;
  total: number;
}

export interface TikTokPromotionsImportPreview {
  format: ImportFileFormat;
  confidence: number;
  recordCount: number;
  period: { start: string; end: string } | null;
  metrics: TikTokPromotionMetricSummary[];
  issues: ImportIssue[];
}

const METRIC_LABELS: Record<TikTokPromotionMetricKey, string> = {
  "promo:adCostBrl": "Gasto total",
  "promo:views": "Views",
  "promo:newFollowers": "Seguidores adquiridos",
};

const METRIC_KEYS = Object.keys(METRIC_LABELS) as TikTokPromotionMetricKey[];

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizeTikTokPromotionRecords(
  records: readonly TikTokPromotionNormalizedRecord[]
): Pick<TikTokPromotionsImportPreview, "recordCount" | "period" | "metrics"> {
  const dates = records
    .map((record) => record.payload.measuredAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const totals: Record<TikTokPromotionMetricKey, number> = {
    "promo:adCostBrl": 0,
    "promo:views": 0,
    "promo:newFollowers": 0,
  };

  for (const record of records) {
    for (const key of METRIC_KEYS) totals[key] += record.payload.metrics[key];
  }

  return {
    recordCount: records.length,
    period: dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
    metrics: METRIC_KEYS.map((key) => ({
      key,
      label: METRIC_LABELS[key],
      total: key === "promo:adCostBrl" ? roundCurrency(totals[key]) : totals[key],
    })),
  };
}

export async function buildTikTokPromotionsImportPreview(params: {
  file: ImportFileDescriptor;
  content: string;
  detection: DetectionResult;
}): Promise<TikTokPromotionsImportPreview> {
  const batchId = randomUUID();
  const batch: ImportBatch = {
    id: batchId,
    platform: "tiktok",
    status: "detected",
    files: [params.file],
    createdAt: new Date().toISOString(),
  };
  const input: ParserInput = {
    batchId,
    platform: "tiktok",
    file: params.file,
    payload: params.content,
  };
  const { records, issues } = await normalizeTikTokPromotionsCsv({ batch, input });

  return {
    format: params.detection.format,
    confidence: params.detection.confidence,
    ...summarizeTikTokPromotionRecords(records),
    issues,
  };
}
