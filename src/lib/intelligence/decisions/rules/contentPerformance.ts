import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";

export const increaseHighGrowthThemesDecision: DecisionRule = {
  id: "increase-high-growth-themes",
  description: "Recommends increasing production of themes associated with audience growth.",
  evaluate({ growthTheme }): Decision[] {
    if (!growthTheme?.hasAnswer || !growthTheme.data) return [];

    const { data } = growthTheme;
    return [
      {
        id: "increase-high-growth-themes",
        title: "Increase production of high-growth themes",
        description:
          data.confidence === "high"
            ? `Theme "${data.theme}" is associated with the strongest growth signals.`
            : `Theme "${data.theme}" leads available growth signals, with low confidence.`,
        priority: data.confidence === "high" ? "medium" : "low",
        recommendedAction: `Increase production around "${data.theme}" and compare subscriber/audience growth in the next cycle.`,
        rationale: `Based on "${growthTheme.question}": ${growthTheme.summary}`,
      },
    ];
  },
};

export const prioritizeHighEngagementFormatsDecision: DecisionRule = {
  id: "prioritize-high-engagement-formats",
  description: "Recommends prioritizing formats associated with stronger engagement.",
  evaluate({ engagementFormat }): Decision[] {
    if (!engagementFormat?.hasAnswer || !engagementFormat.data) return [];

    const { data } = engagementFormat;
    return [
      {
        id: "prioritize-high-engagement-formats",
        title: "Prioritize high-engagement formats",
        description:
          data.confidence === "high"
            ? `Format "${data.format}" currently leads engagement signals.`
            : `Format "${data.format}" leads with limited evidence.`,
        priority: data.confidence === "high" ? "medium" : "low",
        recommendedAction: `Prioritize "${data.format}" formats in the next production batch and track engagement metrics.`,
        rationale: `Based on "${engagementFormat.question}": ${engagementFormat.summary}`,
      },
    ];
  },
};

export const expandAudienceAcquisitionContentDecision: DecisionRule = {
  id: "expand-audience-acquisition-content",
  description: "Recommends expanding content associated with audience acquisition.",
  evaluate({ audienceAcquisitionContent }): Decision[] {
    if (!audienceAcquisitionContent?.hasAnswer || !audienceAcquisitionContent.data) return [];

    const { data } = audienceAcquisitionContent;
    return [
      {
        id: "expand-audience-acquisition-content",
        title: "Expand audience-acquisition content",
        description:
          data.confidence === "high"
            ? `"${data.title}" is associated with stronger audience-acquisition signals.`
            : `"${data.title}" leads acquisition proxies with low confidence.`,
        priority: data.confidence === "high" ? "medium" : "low",
        recommendedAction: `Expand content in the same acquisition pattern as "${data.title}".`,
        rationale: `Based on "${audienceAcquisitionContent.question}": ${audienceAcquisitionContent.summary}`,
      },
    ];
  },
};

export const reinforceRetentionFocusedContentDecision: DecisionRule = {
  id: "reinforce-retention-focused-content",
  description: "Recommends reinforcing content associated with stronger retention signals.",
  evaluate({ retentionContent }): Decision[] {
    if (!retentionContent?.hasAnswer || !retentionContent.data) return [];

    const { data } = retentionContent;
    return [
      {
        id: "reinforce-retention-focused-content",
        title: "Reinforce retention-focused content",
        description:
          data.confidence === "high"
            ? `"${data.title}" shows the strongest retention association via watch time.`
            : `"${data.title}" leads watch time with low-confidence retention linkage.`,
        priority: data.confidence === "high" ? "medium" : "low",
        recommendedAction: `Reinforce retention-focused patterns from "${data.title}" in upcoming publications.`,
        rationale: `Based on "${retentionContent.question}": ${retentionContent.summary}`,
      },
    ];
  },
};
