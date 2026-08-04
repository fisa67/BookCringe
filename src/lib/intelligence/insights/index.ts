export { INTELLIGENCE_RULES, runIntelligenceRules } from "@/lib/intelligence/insights/engine";
export type { Insight, InsightSeverity, Rule, RuleContext } from "@/lib/intelligence/insights/types";

export { STALE_DATASET_THRESHOLD_DAYS, staleDatasetRule } from "@/lib/intelligence/insights/rules/staleDataset";
export { MIN_CONTENTS_PER_DATASET, lowContentVolumeRule } from "@/lib/intelligence/insights/rules/lowContentVolume";
export { RECENT_IMPORT_THRESHOLD_DAYS, noRecentImportRule } from "@/lib/intelligence/insights/rules/noRecentImport";
export {
  UNMATCHED_CONTENT_RATIO_THRESHOLD,
  unmatchedContentRule,
} from "@/lib/intelligence/insights/rules/unmatchedContent";
export {
  PLATFORMS_WITH_PERSISTENCE,
  platformWithoutDatasetRule,
} from "@/lib/intelligence/insights/rules/platformWithoutDataset";
export {
  audienceContentAlignmentRule,
  audienceEmergingTerritoriesRule,
  audienceGrowthLeadersRule,
  audienceUnderservedSegmentsRule,
} from "@/lib/intelligence/insights/rules/audienceInsights";
export {
  audienceAcquisitionPatternsRule,
  audienceRetentionPatternsRule,
  topEngagementDriversRule,
  topGrowthDriversRule,
} from "@/lib/intelligence/insights/rules/contentPerformanceInsights";
export { contentAudienceCorrelationRule } from "@/lib/intelligence/insights/rules/contentAudienceCorrelation";
export { campaignEfficiencyRule } from "@/lib/intelligence/insights/rules/campaignEfficiency";
