export { DECISION_RULES, runDecisionEngine } from "@/lib/intelligence/decisions/engine";
export type { Decision, DecisionContext, DecisionPriority, DecisionRule } from "@/lib/intelligence/decisions/types";

export { repeatBestThemeDecision } from "@/lib/intelligence/decisions/rules/repeatBestTheme";
export { importStaleDatasetDecision } from "@/lib/intelligence/decisions/rules/importStaleDataset";
export { completeMatchingDecision } from "@/lib/intelligence/decisions/rules/completeMatching";
export {
  focusTopTerritoryDecision,
  publishAtActivityPeakDecision,
  respondToFollowerGrowthDecision,
  servePrimaryAudienceDecision,
} from "@/lib/intelligence/decisions/rules/audience";
export {
  exploreGrowingTerritoryDecision,
  increaseFocusOnGrowingSegmentDecision,
  rebalancePublishingStrategyDecision,
  testFormatForUnderservedSegmentDecision,
} from "@/lib/intelligence/decisions/rules/audienceStrategy";
export {
  expandAudienceAcquisitionContentDecision,
  increaseHighGrowthThemesDecision,
  prioritizeHighEngagementFormatsDecision,
  reinforceRetentionFocusedContentDecision,
} from "@/lib/intelligence/decisions/rules/contentPerformance";
export { reallocateCampaignBudgetDecision } from "@/lib/intelligence/decisions/rules/campaignEfficiency";
