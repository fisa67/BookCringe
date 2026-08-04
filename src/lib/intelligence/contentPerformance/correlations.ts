import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import {
  audienceSummaries,
  type AudienceEvidenceConfidence,
} from "@/lib/intelligence/audience/signals";

export type ContentPerformanceConfidence = AudienceEvidenceConfidence;

type ContentMetricKey = "views" | "watchTimeHours" | "impressions" | "subscribers";

export type ContentEngagementFormat = "watch-time" | "reach" | "subscriber-gain";

export interface ContentPerformanceSnapshot {
  contentId: string;
  title: string;
  theme: string;
  platform: ImportPlatform;
  datasetId: string;
  publishedAt?: string;
  views: number;
  watchTimeHours: number;
  impressions: number;
  subscribers: number;
  engagementScore: number;
  retentionScore: number;
  format: ContentEngagementFormat;
}

export interface ContentCorrelationResult {
  contentId: string;
  title: string;
  theme: string;
  platform: ImportPlatform;
  score: number;
  confidence: AudienceEvidenceConfidence;
  evidence: string;
  format?: ContentEngagementFormat;
}

function latestValueByContent(
  metrics: IntelligenceMetricRecord[],
  key: ContentMetricKey
): Map<string, number> {
  const latest = new Map<string, { value: number; measuredAt: string; createdAt: string }>();

  for (const metric of metrics) {
    if (metric.key !== key || !metric.content_id) continue;
    const current = latest.get(metric.content_id);
    if (
      !current ||
      metric.measured_at > current.measuredAt ||
      (metric.measured_at === current.measuredAt && metric.created_at > current.createdAt)
    ) {
      latest.set(metric.content_id, {
        value: metric.value,
        measuredAt: metric.measured_at,
        createdAt: metric.created_at,
      });
    }
  }

  return new Map(Array.from(latest, ([contentId, entry]) => [contentId, entry.value]));
}

function deriveFormat(snapshot: {
  views: number;
  watchTimeHours: number;
  subscribers: number;
}): ContentEngagementFormat {
  const watchIntensity = snapshot.views > 0 ? snapshot.watchTimeHours / snapshot.views : snapshot.watchTimeHours;
  const candidates: Array<{ format: ContentEngagementFormat; value: number }> = [
    { format: "watch-time", value: watchIntensity },
    { format: "reach", value: snapshot.views },
    { format: "subscriber-gain", value: snapshot.subscribers },
  ];
  return candidates.sort((a, b) => b.value - a.value)[0]?.format ?? "reach";
}

export function buildContentPerformanceSnapshots(params: {
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books?: CmsBookRecord[];
}): ContentPerformanceSnapshot[] {
  const datasetById = new Map(params.datasets.map((dataset) => [dataset.id, dataset]));
  const bookById = new Map((params.books ?? []).map((book) => [book.id, book]));
  const views = latestValueByContent(params.metrics, "views");
  const watchTimeHours = latestValueByContent(params.metrics, "watchTimeHours");
  const impressions = latestValueByContent(params.metrics, "impressions");
  const subscribers = latestValueByContent(params.metrics, "subscribers");

  return params.contents
    .map((content): ContentPerformanceSnapshot | null => {
      const viewValue = views.get(content.id) ?? 0;
      const watchValue = watchTimeHours.get(content.id) ?? 0;
      const impressionValue = impressions.get(content.id) ?? 0;
      const subscriberValue = subscribers.get(content.id) ?? 0;
      if (viewValue <= 0 && watchValue <= 0 && impressionValue <= 0 && subscriberValue <= 0) {
        return null;
      }

      const theme = content.book_id ? bookById.get(content.book_id)?.title ?? content.title : content.title;
      const platform = (datasetById.get(content.dataset_id)?.platform ?? "unknown") as ImportPlatform;

      return {
        contentId: content.id,
        title: content.title,
        theme,
        platform,
        datasetId: content.dataset_id,
        publishedAt: content.published_at,
        views: viewValue,
        watchTimeHours: watchValue,
        impressions: impressionValue,
        subscribers: subscriberValue,
        engagementScore: viewValue + watchValue * 100,
        retentionScore: watchValue,
        format: deriveFormat({
          views: viewValue,
          watchTimeHours: watchValue,
          subscribers: subscriberValue,
        }),
      };
    })
    .filter((entry): entry is ContentPerformanceSnapshot => entry !== null)
    .sort((a, b) => b.engagementScore - a.engagementScore);
}

function audienceGrowthSignal(
  datasets: IntelligenceDatasetRecord[],
  metrics: IntelligenceMetricRecord[]
): { growth: number; present: boolean } {
  const summary = audienceSummaries(datasets, metrics).find((entry) => entry.followerGrowth);
  if (!summary?.followerGrowth) return { growth: 0, present: false };
  return { growth: summary.followerGrowth.value, present: true };
}

function pickTop(
  snapshots: ContentPerformanceSnapshot[],
  scoreOf: (snapshot: ContentPerformanceSnapshot) => number
): ContentPerformanceSnapshot | null {
  const ranked = [...snapshots].sort((a, b) => scoreOf(b) - scoreOf(a));
  const top = ranked[0];
  if (!top || scoreOf(top) <= 0) return null;
  return top;
}

/** content -> growth: associates content subscriber gains with audience follower growth when both exist. */
export function correlateContentToGrowth(params: {
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books?: CmsBookRecord[];
}): ContentCorrelationResult | null {
  const snapshots = buildContentPerformanceSnapshots(params);
  const top = pickTop(snapshots, (snapshot) => snapshot.subscribers);
  if (!top) return null;

  const audience = audienceGrowthSignal(params.datasets, params.metrics);
  const confidence: AudienceEvidenceConfidence =
    audience.present && audience.growth > 0 && snapshots.filter((entry) => entry.subscribers > 0).length >= 2
      ? "high"
      : "low";

  return {
    contentId: top.contentId,
    title: top.title,
    theme: top.theme,
    platform: top.platform,
    score: top.subscribers,
    confidence,
    evidence:
      confidence === "high"
        ? `Content "${top.title}" leads subscriber gains (${top.subscribers}) while audience follower growth is positive (${audience.growth}).`
        : audience.present
          ? `Content "${top.title}" leads subscriber gains (${top.subscribers}); audience growth evidence is weak or incomplete.`
          : `Content "${top.title}" leads subscriber gains (${top.subscribers}), but no audience growth metric is available yet.`,
  };
}

/** content -> engagement: ranks formats derived from metric profiles by engagement score. */
export function correlateContentToEngagement(params: {
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books?: CmsBookRecord[];
}): ContentCorrelationResult | null {
  const snapshots = buildContentPerformanceSnapshots(params);
  if (snapshots.length === 0) return null;

  const byFormat = new Map<ContentEngagementFormat, { score: number; exemplar: ContentPerformanceSnapshot }>();
  for (const snapshot of snapshots) {
    const current = byFormat.get(snapshot.format);
    if (!current) {
      byFormat.set(snapshot.format, { score: snapshot.engagementScore, exemplar: snapshot });
      continue;
    }
    byFormat.set(snapshot.format, {
      score: current.score + snapshot.engagementScore,
      exemplar:
        snapshot.engagementScore > current.exemplar.engagementScore ? snapshot : current.exemplar,
    });
  }

  const leader = Array.from(byFormat.entries()).sort((a, b) => b[1].score - a[1].score)[0];
  if (!leader) return null;

  const [format, entry] = leader;
  const confidence: AudienceEvidenceConfidence = snapshots.length >= 2 ? "high" : "low";

  return {
    contentId: entry.exemplar.contentId,
    title: entry.exemplar.title,
    theme: entry.exemplar.theme,
    platform: entry.exemplar.platform,
    score: entry.score,
    confidence,
    format,
    evidence:
      confidence === "high"
        ? `Format "${format}" leads engagement across ${snapshots.length} contents (score ${Math.round(entry.score)}), exemplified by "${entry.exemplar.title}".`
        : `Low confidence: only one content profile is available; "${entry.exemplar.title}" currently leads as a "${format}" exemplar.`,
  };
}

/** content -> acquisition: contents with subscriber gains co-occurring with audience expansion. */
export function correlateContentToAcquisition(params: {
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books?: CmsBookRecord[];
}): ContentCorrelationResult | null {
  const snapshots = buildContentPerformanceSnapshots(params);
  const top = pickTop(snapshots, (snapshot) => snapshot.subscribers);
  if (!top) return null;

  const audience = audienceGrowthSignal(params.datasets, params.metrics);
  const genderLeader = audienceSummaries(params.datasets, params.metrics).find(
    (summary) => summary.genderDistribution.length > 0
  )?.genderDistribution[0];

  const confidence: AudienceEvidenceConfidence =
    top.subscribers > 0 && audience.present && audience.growth > 0 ? "high" : "low";

  return {
    contentId: top.contentId,
    title: top.title,
    theme: top.theme,
    platform: top.platform,
    score: top.subscribers,
    confidence,
    evidence:
      confidence === "high"
        ? `"${top.title}" leads acquisition signals (${top.subscribers} subscriber gains) alongside audience growth${genderLeader ? ` led by ${genderLeader.label}` : ""}.`
        : `Low confidence: "${top.title}" leads subscriber gains (${top.subscribers}), but audience acquisition evidence is incomplete.`,
  };
}

/** content -> retention: watch-time as retention proxy, optionally reinforced by audience activity. */
export function correlateContentToRetention(params: {
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books?: CmsBookRecord[];
}): ContentCorrelationResult | null {
  const snapshots = buildContentPerformanceSnapshots(params);
  const top = pickTop(snapshots, (snapshot) => snapshot.retentionScore);
  if (!top) return null;

  const hasActivity = audienceSummaries(params.datasets, params.metrics).some(
    (summary) => summary.activityPeak !== null
  );
  const confidence: AudienceEvidenceConfidence =
    top.retentionScore > 0 && snapshots.filter((entry) => entry.retentionScore > 0).length >= 2 && hasActivity
      ? "high"
      : "low";

  return {
    contentId: top.contentId,
    title: top.title,
    theme: top.theme,
    platform: top.platform,
    score: top.retentionScore,
    confidence,
    evidence:
      confidence === "high"
        ? `"${top.title}" leads retention via watch time (${top.retentionScore}h) while audience activity data is also present.`
        : `Low confidence: "${top.title}" leads watch time (${top.retentionScore}h), but retention evidence across content/audience is still thin.`,
  };
}

export function correlateContentThemesToGrowth(params: {
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books?: CmsBookRecord[];
}): ContentCorrelationResult | null {
  const snapshots = buildContentPerformanceSnapshots(params);
  if (snapshots.length === 0) return null;

  const byTheme = new Map<string, { score: number; exemplar: ContentPerformanceSnapshot }>();
  for (const snapshot of snapshots) {
    const current = byTheme.get(snapshot.theme);
    if (!current) {
      byTheme.set(snapshot.theme, { score: snapshot.subscribers, exemplar: snapshot });
      continue;
    }
    byTheme.set(snapshot.theme, {
      score: current.score + snapshot.subscribers,
      exemplar: snapshot.subscribers > current.exemplar.subscribers ? snapshot : current.exemplar,
    });
  }

  const leader = Array.from(byTheme.entries())
    .map(([theme, entry]) => ({ theme, ...entry }))
    .sort((a, b) => b.score - a.score)[0];
  if (!leader || leader.score <= 0) return null;

  const audience = audienceGrowthSignal(params.datasets, params.metrics);
  const confidence: AudienceEvidenceConfidence =
    audience.present && audience.growth > 0 && byTheme.size >= 2 ? "high" : "low";

  return {
    contentId: leader.exemplar.contentId,
    title: leader.exemplar.title,
    theme: leader.theme,
    platform: leader.exemplar.platform,
    score: leader.score,
    confidence,
    evidence:
      confidence === "high"
        ? `Theme "${leader.theme}" accumulates the highest subscriber gains (${leader.score}) while audience growth is positive.`
        : `Low confidence: theme "${leader.theme}" leads subscriber gains (${leader.score}), but theme/audience growth evidence is incomplete.`,
  };
}
