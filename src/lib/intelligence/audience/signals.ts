import type {
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import {
  buildAudienceDatasetSummaries,
  isAudienceDataset,
  isAudienceMetric,
  type AudienceDatasetSummary,
} from "@/lib/intelligence/audience/summary";

export type AudienceEvidenceConfidence = "low" | "high";

export interface AudienceShareDelta {
  label: string;
  previousShare: number;
  currentShare: number;
  delta: number;
}

export interface AudienceDistributionComparison {
  datasetId: string;
  datasetName: string;
  platform: IntelligenceDatasetRecord["platform"];
  previousMeasuredAt: string;
  currentMeasuredAt: string;
  deltas: AudienceShareDelta[];
}

const GENDER_PREFIX = "gender:";
const TERRITORY_PREFIX = "territory:";

function distributionByMeasuredAt(
  metrics: IntelligenceMetricRecord[],
  prefix: string
): Map<string, Map<string, number>> {
  const byMeasuredAt = new Map<string, Map<string, IntelligenceMetricRecord>>();

  for (const metric of metrics) {
    if (!metric.key.startsWith(prefix)) continue;
    const bucket = byMeasuredAt.get(metric.measured_at) ?? new Map();
    const current = bucket.get(metric.key);
    if (!current || metric.created_at > current.created_at) {
      bucket.set(metric.key, metric);
    }
    byMeasuredAt.set(metric.measured_at, bucket);
  }

  return new Map(
    Array.from(byMeasuredAt, ([measuredAt, rows]) => [
      measuredAt,
      new Map(
        Array.from(rows.values()).map((metric) => [
          metric.key.slice(prefix.length),
          metric.value,
        ])
      ),
    ])
  );
}

function compareLatestSnapshots(
  dataset: IntelligenceDatasetRecord,
  metrics: IntelligenceMetricRecord[],
  prefix: string
): AudienceDistributionComparison | null {
  const snapshots = distributionByMeasuredAt(metrics, prefix);
  const measuredAts = Array.from(snapshots.keys()).sort((a, b) => a.localeCompare(b));
  if (measuredAts.length < 2) return null;

  const previousMeasuredAt = measuredAts[measuredAts.length - 2]!;
  const currentMeasuredAt = measuredAts[measuredAts.length - 1]!;
  const previous = snapshots.get(previousMeasuredAt) ?? new Map();
  const current = snapshots.get(currentMeasuredAt) ?? new Map();
  const labels = new Set([...previous.keys(), ...current.keys()]);

  const deltas = Array.from(labels)
    .map((label) => {
      const previousShare = previous.get(label) ?? 0;
      const currentShare = current.get(label) ?? 0;
      return {
        label,
        previousShare,
        currentShare,
        delta: currentShare - previousShare,
      };
    })
    .sort((a, b) => b.delta - a.delta || b.currentShare - a.currentShare);

  return {
    datasetId: dataset.id,
    datasetName: dataset.name,
    platform: dataset.platform,
    previousMeasuredAt,
    currentMeasuredAt,
    deltas,
  };
}

export function compareAudienceDistributions(
  datasets: IntelligenceDatasetRecord[],
  metrics: IntelligenceMetricRecord[],
  kind: "gender" | "territory"
): AudienceDistributionComparison[] {
  const prefix = kind === "gender" ? GENDER_PREFIX : TERRITORY_PREFIX;

  return datasets
    .filter((dataset) => isAudienceDataset(dataset, metrics))
    .map((dataset) => {
      const audienceMetrics = metrics.filter(
        (metric) => metric.dataset_id === dataset.id && isAudienceMetric(metric)
      );
      return compareLatestSnapshots(dataset, audienceMetrics, prefix);
    })
    .filter((entry): entry is AudienceDistributionComparison => entry !== null);
}

export function audienceSummaries(
  datasets: IntelligenceDatasetRecord[],
  metrics: IntelligenceMetricRecord[]
): AudienceDatasetSummary[] {
  return buildAudienceDatasetSummaries(datasets, metrics);
}

export function leadingPositiveDelta(
  comparison: AudienceDistributionComparison,
  options?: { excludeLabels?: string[] }
): AudienceShareDelta | null {
  const excluded = new Set(options?.excludeLabels ?? []);
  const candidate = comparison.deltas.find(
    (entry) => entry.delta > 0 && !excluded.has(entry.label)
  );
  return candidate ?? null;
}

export function secondaryMeaningfulSegment(
  entries: { label: string; value: number }[],
  minimumShare = 0.15
): { label: string; value: number } | null {
  if (entries.length < 2) return null;
  const secondary = entries[1];
  if (!secondary || secondary.value < minimumShare) return null;
  return secondary;
}
