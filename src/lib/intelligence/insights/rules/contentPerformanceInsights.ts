import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import {
  correlateContentThemesToGrowth,
  correlateContentToAcquisition,
  correlateContentToEngagement,
  correlateContentToRetention,
} from "@/lib/intelligence/contentPerformance/correlations";

function lowConfidenceInsight(ruleId: string, title: string, message: string): Insight {
  return {
    id: `${ruleId}:low-confidence`,
    ruleId,
    severity: "info",
    title,
    message: `Low confidence: ${message}`,
  };
}

export const topGrowthDriversRule: Rule = {
  id: "top-growth-drivers",
  description: "Highlights content themes associated with the strongest audience-growth signals.",
  evaluate({ datasets, contents, metrics }): Insight[] {
    const result = correlateContentThemesToGrowth({ datasets, contents, metrics });
    if (!result) return [];

    if (result.confidence === "low") {
      return [
        lowConfidenceInsight(
          "top-growth-drivers",
          "Top Growth Drivers",
          `theme "${result.theme}" leads available subscriber gains, but content↔audience growth evidence is incomplete.`
        ),
      ];
    }

    return [
      {
        id: `top-growth-drivers:${result.contentId}`,
        ruleId: "top-growth-drivers",
        severity: "info",
        title: "Top Growth Drivers",
        message: `Theme "${result.theme}" is associated with the strongest growth signals (subscriber gains ${result.score}).`,
      },
    ];
  },
};

export const topEngagementDriversRule: Rule = {
  id: "top-engagement-drivers",
  description: "Highlights content formats associated with the strongest engagement signals.",
  evaluate({ datasets, contents, metrics }): Insight[] {
    const result = correlateContentToEngagement({ datasets, contents, metrics });
    if (!result?.format) return [];

    if (result.confidence === "low") {
      return [
        lowConfidenceInsight(
          "top-engagement-drivers",
          "Top Engagement Drivers",
          `format "${result.format}" leads with limited content evidence (exemplar "${result.title}").`
        ),
      ];
    }

    return [
      {
        id: `top-engagement-drivers:${result.format}`,
        ruleId: "top-engagement-drivers",
        severity: "info",
        title: "Top Engagement Drivers",
        message: `Format "${result.format}" leads engagement, exemplified by "${result.title}".`,
      },
    ];
  },
};

export const audienceAcquisitionPatternsRule: Rule = {
  id: "audience-acquisition-patterns",
  description: "Highlights content associated with audience acquisition signals.",
  evaluate({ datasets, contents, metrics }): Insight[] {
    const result = correlateContentToAcquisition({ datasets, contents, metrics });
    if (!result) return [];

    if (result.confidence === "low") {
      return [
        lowConfidenceInsight(
          "audience-acquisition-patterns",
          "Audience Acquisition Patterns",
          `"${result.title}" leads subscriber gains, but audience acquisition linkage remains incomplete.`
        ),
      ];
    }

    return [
      {
        id: `audience-acquisition-patterns:${result.contentId}`,
        ruleId: "audience-acquisition-patterns",
        severity: "info",
        title: "Audience Acquisition Patterns",
        message: `"${result.title}" is associated with audience acquisition (${result.score} subscriber gains with positive audience growth).`,
      },
    ];
  },
};

export const audienceRetentionPatternsRule: Rule = {
  id: "audience-retention-patterns",
  description: "Highlights content associated with retention/watch-time signals.",
  evaluate({ datasets, contents, metrics }): Insight[] {
    const result = correlateContentToRetention({ datasets, contents, metrics });
    if (!result) return [];

    if (result.confidence === "low") {
      return [
        lowConfidenceInsight(
          "audience-retention-patterns",
          "Audience Retention Patterns",
          `"${result.title}" leads watch time, but retention evidence across content/audience is still thin.`
        ),
      ];
    }

    return [
      {
        id: `audience-retention-patterns:${result.contentId}`,
        ruleId: "audience-retention-patterns",
        severity: "info",
        title: "Audience Retention Patterns",
        message: `"${result.title}" shows the strongest retention association via watch time (${result.score}h).`,
      },
    ];
  },
};
