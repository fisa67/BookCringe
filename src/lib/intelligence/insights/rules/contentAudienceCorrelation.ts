import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import {
  correlateContentThemesToGrowth,
  correlateContentToAcquisition,
  correlateContentToRetention,
} from "@/lib/intelligence/contentPerformance/correlations";

export const contentAudienceCorrelationRule: Rule = {
  id: "content-audience-correlation",
  description: "Unifies existing high-confidence Content → Audience correlation signals.",
  evaluate({ datasets, contents, metrics }): Insight[] {
    const params = { datasets, contents, metrics };
    const signals = [
      { label: "Audience Growth", result: correlateContentThemesToGrowth(params) },
      { label: "Audience Acquisition", result: correlateContentToAcquisition(params) },
      { label: "Audience Retention", result: correlateContentToRetention(params) },
    ].filter(
      (signal): signal is {
        label: string;
        result: NonNullable<typeof signal.result>;
      } => signal.result?.confidence === "high"
    );

    if (signals.length === 0) return [];

    return [
      {
        id: "content-audience-correlation",
        ruleId: "content-audience-correlation",
        severity: "info",
        title: "Content Theme ↓ Audience Signal",
        message: signals
          .map(({ label, result }) => `${result.theme} ↓ ${label}: ${result.evidence}`)
          .join(" · "),
      },
    ];
  },
};
