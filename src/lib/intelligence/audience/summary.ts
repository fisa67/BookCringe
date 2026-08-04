import type {
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

export const INSTAGRAM_AUDIENCE_DATASET_NAME = "Instagram — Audiência";

const FOLLOWERS_KEY = "followers";
const FOLLOWERS_DELTA_KEY = "followersDelta";
const ACTIVE_FOLLOWERS_KEY = "activeFollowers";
const GENDER_PREFIX = "gender:";
const TERRITORY_PREFIX = "territory:";

export interface AudienceMetricValue {
  value: number;
  measuredAt: string;
}

export interface AudienceDistributionEntry {
  label: string;
  value: number;
}

export interface AudienceDatasetSummary {
  datasetId: string;
  datasetName: string;
  platform: IntelligenceDatasetRecord["platform"];
  followers: AudienceMetricValue | null;
  followerGrowth: AudienceMetricValue | null;
  activityPeak: AudienceMetricValue | null;
  genderDistribution: AudienceDistributionEntry[];
  territoryDistribution: AudienceDistributionEntry[];
}

export function isAudienceMetric(metric: IntelligenceMetricRecord): boolean {
  return (
    !metric.content_id &&
    (metric.key === FOLLOWERS_KEY ||
      metric.key === FOLLOWERS_DELTA_KEY ||
      metric.key === ACTIVE_FOLLOWERS_KEY ||
      metric.key.startsWith(GENDER_PREFIX) ||
      metric.key.startsWith(TERRITORY_PREFIX))
  );
}

export function isAudienceDataset(
  dataset: IntelligenceDatasetRecord,
  metrics: IntelligenceMetricRecord[]
): boolean {
  if (dataset.platform !== "instagram") return false;

  return (
    dataset.name === INSTAGRAM_AUDIENCE_DATASET_NAME ||
    metrics.some((metric) => metric.dataset_id === dataset.id && isAudienceMetric(metric))
  );
}

function newestMetric(metrics: IntelligenceMetricRecord[], key: string): IntelligenceMetricRecord | undefined {
  return metrics
    .filter((metric) => metric.key === key)
    .sort(
      (a, b) =>
        b.measured_at.localeCompare(a.measured_at) ||
        b.created_at.localeCompare(a.created_at)
    )[0];
}

function peakMetric(metrics: IntelligenceMetricRecord[], key: string): IntelligenceMetricRecord | undefined {
  const latestByMeasuredAt = new Map<string, IntelligenceMetricRecord>();
  for (const metric of metrics) {
    if (metric.key !== key) continue;
    const current = latestByMeasuredAt.get(metric.measured_at);
    if (!current || metric.created_at > current.created_at) {
      latestByMeasuredAt.set(metric.measured_at, metric);
    }
  }

  return Array.from(latestByMeasuredAt.values())
    .sort(
      (a, b) =>
        b.value - a.value ||
        b.measured_at.localeCompare(a.measured_at) ||
        b.created_at.localeCompare(a.created_at)
    )[0];
}

function latestDistribution(
  metrics: IntelligenceMetricRecord[],
  prefix: string
): AudienceDistributionEntry[] {
  const matching = metrics.filter((metric) => metric.key.startsWith(prefix));
  const latestMeasuredAt = matching.reduce<string | null>(
    (latest, metric) =>
      !latest || metric.measured_at > latest ? metric.measured_at : latest,
    null
  );
  if (!latestMeasuredAt) return [];

  const latestByKey = new Map<string, IntelligenceMetricRecord>();
  for (const metric of matching) {
    if (metric.measured_at !== latestMeasuredAt) continue;
    const current = latestByKey.get(metric.key);
    if (!current || metric.created_at > current.created_at) {
      latestByKey.set(metric.key, metric);
    }
  }

  return Array.from(latestByKey.values())
    .map((metric) => ({
      label: metric.key.slice(prefix.length),
      value: metric.value,
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildAudienceDatasetSummaries(
  datasets: IntelligenceDatasetRecord[],
  metrics: IntelligenceMetricRecord[]
): AudienceDatasetSummary[] {
  return datasets
    .filter((dataset) => isAudienceDataset(dataset, metrics))
    .map((dataset) => {
      const audienceMetrics = metrics.filter(
        (metric) => metric.dataset_id === dataset.id && isAudienceMetric(metric)
      );
      const followers = newestMetric(audienceMetrics, FOLLOWERS_KEY);
      const followerGrowth = newestMetric(audienceMetrics, FOLLOWERS_DELTA_KEY);
      const activityPeak = peakMetric(audienceMetrics, ACTIVE_FOLLOWERS_KEY);

      return {
        datasetId: dataset.id,
        datasetName: dataset.name,
        platform: dataset.platform,
        followers: followers
          ? { value: followers.value, measuredAt: followers.measured_at }
          : null,
        followerGrowth: followerGrowth
          ? { value: followerGrowth.value, measuredAt: followerGrowth.measured_at }
          : null,
        activityPeak: activityPeak
          ? { value: activityPeak.value, measuredAt: activityPeak.measured_at }
          : null,
        genderDistribution: latestDistribution(audienceMetrics, GENDER_PREFIX),
        territoryDistribution: latestDistribution(audienceMetrics, TERRITORY_PREFIX),
      };
    });
}
