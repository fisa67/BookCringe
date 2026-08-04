import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";

export const increaseFocusOnGrowingSegmentDecision: DecisionRule = {
  id: "increase-focus-on-growing-segment",
  description: "Recommends increasing focus on the fastest-growing audience segment.",
  evaluate({ fastestGrowingSegment }): Decision[] {
    if (!fastestGrowingSegment?.hasAnswer || !fastestGrowingSegment.data) return [];

    const { data } = fastestGrowingSegment;
    const lowConfidence = data.confidence === "low";

    return [
      {
        id: "increase-focus-on-growing-segment",
        title: `Increase focus on ${data.segment}`,
        description: lowConfidence
          ? `${data.segment} currently leads the audience profile, but growth evidence is still incomplete.`
          : `${data.segment} is the fastest-growing audience segment in the latest snapshots.`,
        priority: lowConfidence ? "low" : "medium",
        recommendedAction: `Increase focus on ${data.segment} in upcoming themes, formats and messaging.`,
        rationale: `Based on "${fastestGrowingSegment.question}": ${fastestGrowingSegment.summary}`,
      },
    ];
  },
};

export const testFormatForUnderservedSegmentDecision: DecisionRule = {
  id: "test-format-for-underserved-segment",
  description: "Recommends testing content formats for an underserved audience segment.",
  evaluate({ underservedSegment }): Decision[] {
    if (!underservedSegment?.hasAnswer || !underservedSegment.data) return [];

    const { data } = underservedSegment;
    return [
      {
        id: "test-format-for-underserved-segment",
        title: `Test new content format for ${data.segment}`,
        description: `${data.segment} holds ${Math.round(data.share * 100)}% of the measured audience while ${data.primarySegment} leads with ${Math.round(data.primaryShare * 100)}%.`,
        priority: data.confidence === "high" ? "medium" : "low",
        recommendedAction: `Test a new content format aimed at ${data.segment} and compare engagement in the next import cycle.`,
        rationale: `Based on "${underservedSegment.question}": ${underservedSegment.summary}`,
      },
    ];
  },
};

export const exploreGrowingTerritoryDecision: DecisionRule = {
  id: "explore-growing-territory",
  description: "Recommends exploring the territory with the strongest growth opportunity.",
  evaluate({ territoryGrowthOpportunity }): Decision[] {
    if (!territoryGrowthOpportunity?.hasAnswer || !territoryGrowthOpportunity.data) return [];

    const { data } = territoryGrowthOpportunity;
    return [
      {
        id: "explore-growing-territory",
        title: `Explore territory ${data.territory}`,
        description:
          data.confidence === "high"
            ? `${data.territory} shows the strongest measured territory growth opportunity.`
            : `${data.territory} is the best current territory candidate, with low confidence until another snapshot arrives.`,
        priority: data.confidence === "high" ? "medium" : "low",
        recommendedAction: `Explore territory ${data.territory} with localized references, timing and distribution tests.`,
        rationale: `Based on "${territoryGrowthOpportunity.question}": ${territoryGrowthOpportunity.summary}`,
      },
    ];
  },
};

export const rebalancePublishingStrategyDecision: DecisionRule = {
  id: "rebalance-publishing-strategy",
  description: "Recommends rebalancing publishing strategy when audience and content evidence diverge.",
  evaluate({ audienceContentMismatch }): Decision[] {
    if (!audienceContentMismatch?.hasAnswer || !audienceContentMismatch.data) return [];
    if (!audienceContentMismatch.data.mismatched) return [];

    const { data } = audienceContentMismatch;
    return [
      {
        id: "rebalance-publishing-strategy",
        title: "Rebalance publishing strategy",
        description:
          data.confidence === "low"
            ? "Audience profile exists, but content evidence is still insufficient for a confident alignment check."
            : `Audience concentration and content matching suggest a strategy imbalance (${Math.round((data.unmatchedRatio ?? 0) * 100)}% unmatched contents).`,
        priority: data.confidence === "high" ? "high" : "low",
        recommendedAction: "Rebalance publishing strategy around the leading audience profile and close content-matching gaps.",
        rationale: `Based on "${audienceContentMismatch.question}": ${audienceContentMismatch.summary}`,
      },
    ];
  },
};
