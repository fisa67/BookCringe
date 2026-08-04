import type { Decision, DecisionContext, DecisionRule } from "@/lib/intelligence/decisions/types";
import { repeatBestThemeDecision } from "@/lib/intelligence/decisions/rules/repeatBestTheme";
import { importStaleDatasetDecision } from "@/lib/intelligence/decisions/rules/importStaleDataset";
import { completeMatchingDecision } from "@/lib/intelligence/decisions/rules/completeMatching";
import {
  focusTopTerritoryDecision,
  publishAtActivityPeakDecision,
  respondToFollowerGrowthDecision,
  servePrimaryAudienceDecision,
} from "@/lib/intelligence/decisions/rules/audience";
import {
  exploreGrowingTerritoryDecision,
  increaseFocusOnGrowingSegmentDecision,
  rebalancePublishingStrategyDecision,
  testFormatForUnderservedSegmentDecision,
} from "@/lib/intelligence/decisions/rules/audienceStrategy";
import {
  expandAudienceAcquisitionContentDecision,
  increaseHighGrowthThemesDecision,
  prioritizeHighEngagementFormatsDecision,
  reinforceRetentionFocusedContentDecision,
} from "@/lib/intelligence/decisions/rules/contentPerformance";
import { reallocateCampaignBudgetDecision } from "@/lib/intelligence/decisions/rules/campaignEfficiency";

/**
 * A Decision Engine em si: uma lista de regras independentes, mesmo
 * formato do `INTELLIGENCE_RULES` dos Insights. Adicionar uma decisão nova
 * nunca exige mudar as demais nem o motor — só implementar `DecisionRule`
 * (`decisions/types.ts`) em `decisions/rules/` e listar aqui.
 */
export const DECISION_RULES: DecisionRule[] = [
  repeatBestThemeDecision,
  importStaleDatasetDecision,
  completeMatchingDecision,
  respondToFollowerGrowthDecision,
  publishAtActivityPeakDecision,
  focusTopTerritoryDecision,
  servePrimaryAudienceDecision,
  increaseFocusOnGrowingSegmentDecision,
  testFormatForUnderservedSegmentDecision,
  exploreGrowingTerritoryDecision,
  rebalancePublishingStrategyDecision,
  increaseHighGrowthThemesDecision,
  prioritizeHighEngagementFormatsDecision,
  expandAudienceAcquisitionContentDecision,
  reinforceRetentionFocusedContentDecision,
  reallocateCampaignBudgetDecision,
];

const PRIORITY_RANK: Record<Decision["priority"], number> = { high: 0, medium: 1, low: 2 };

export function runDecisionEngine(context: DecisionContext): Decision[] {
  return DECISION_RULES.flatMap((rule) => rule.evaluate(context)).sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  );
}
