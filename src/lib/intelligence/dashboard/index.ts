export { buildIntelligenceDashboardData } from "@/lib/intelligence/dashboard/summary";

export type {
  IntelligenceDashboardData,
  IntelligenceDashboardSummary,
  DashboardCorrelations,
  LatestImportSummary,
  MatchingRateSummary,
  PlatformDistributionEntry,
  TopContentEntry,
} from "@/lib/intelligence/dashboard/types";
export type {
  AudienceDatasetSummary,
  AudienceDistributionEntry,
  AudienceMetricValue,
} from "@/lib/intelligence/audience/summary";
export type { CampaignDatasetSummary, CampaignEntry } from "@/lib/intelligence/campaign/summary";
export { campaignEntryLabel } from "@/lib/intelligence/campaign/summary";
