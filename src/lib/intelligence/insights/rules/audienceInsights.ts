import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import {
  audienceSummaries,
  compareAudienceDistributions,
  leadingPositiveDelta,
  secondaryMeaningfulSegment,
} from "@/lib/intelligence/audience/signals";

function lowConfidenceInsight(ruleId: string, title: string, message: string): Insight {
  return {
    id: `${ruleId}:low-confidence`,
    ruleId,
    severity: "info",
    title,
    message: `Low confidence: ${message}`,
  };
}

export const audienceGrowthLeadersRule: Rule = {
  id: "audience-growth-leaders",
  description: "Highlights audience segments with measured share growth between snapshots.",
  evaluate({ datasets, metrics }): Insight[] {
    const comparisons = compareAudienceDistributions(datasets, metrics, "gender");
    const leaders = comparisons
      .map((comparison) => ({ comparison, leader: leadingPositiveDelta(comparison) }))
      .filter((entry) => entry.leader);

    if (leaders.length > 0) {
      return leaders.map(({ comparison, leader }) => ({
        id: `audience-growth-leaders:${comparison.datasetId}:${leader!.label}`,
        ruleId: "audience-growth-leaders",
        severity: "info" as const,
        title: "Growth Leaders",
        message: `${leader!.label} leads audience growth (+${Math.round(leader!.delta * 100)} pp share) on ${comparison.datasetName}.`,
      }));
    }

    const hasGender = audienceSummaries(datasets, metrics).some(
      (summary) => summary.genderDistribution.length > 0
    );
    if (!hasGender) return [];

    return [
      lowConfidenceInsight(
        "audience-growth-leaders",
        "Growth Leaders",
        "a gender distribution exists, but at least two snapshots are required before naming a growth leader."
      ),
    ];
  },
};

export const audienceUnderservedSegmentsRule: Rule = {
  id: "audience-underserved-segments",
  description: "Flags meaningful secondary audience segments that may be underserved.",
  evaluate({ datasets, metrics, contents }): Insight[] {
    const summaries = audienceSummaries(datasets, metrics);
    const insights: Insight[] = [];

    for (const summary of summaries) {
      const primary = summary.genderDistribution[0];
      const secondary = secondaryMeaningfulSegment(summary.genderDistribution);
      if (!primary || !secondary) continue;

      if (contents.length === 0) {
        insights.push(
          lowConfidenceInsight(
            "audience-underserved-segments",
            "Underserved Segments",
            `${secondary.label} is a meaningful secondary segment (${Math.round(secondary.value * 100)}%), but no content imports exist to confirm under-service.`
          )
        );
        continue;
      }

      insights.push({
        id: `audience-underserved-segments:${summary.datasetId}:${secondary.label}`,
        ruleId: "audience-underserved-segments",
        severity: "info",
        title: "Underserved Segments",
        message: `${secondary.label} (${Math.round(secondary.value * 100)}%) trails ${primary.label} (${Math.round(primary.value * 100)}%) while ${contents.length} content item(s) are already available.`,
      });
    }

    return insights;
  },
};

export const audienceEmergingTerritoriesRule: Rule = {
  id: "audience-emerging-territories",
  description: "Highlights territories with measured share growth between snapshots.",
  evaluate({ datasets, metrics }): Insight[] {
    const comparisons = compareAudienceDistributions(datasets, metrics, "territory");
    const leaders = comparisons
      .map((comparison) => ({
        comparison,
        leader: leadingPositiveDelta(comparison, { excludeLabels: ["Others"] }),
      }))
      .filter((entry) => entry.leader);

    if (leaders.length > 0) {
      return leaders.map(({ comparison, leader }) => ({
        id: `audience-emerging-territories:${comparison.datasetId}:${leader!.label}`,
        ruleId: "audience-emerging-territories",
        severity: "info" as const,
        title: "Emerging Territories",
        message: `${leader!.label} is emerging (+${Math.round(leader!.delta * 100)} pp share) on ${comparison.datasetName}.`,
      }));
    }

    const hasTerritory = audienceSummaries(datasets, metrics).some(
      (summary) => summary.territoryDistribution.length > 0
    );
    if (!hasTerritory) return [];

    return [
      lowConfidenceInsight(
        "audience-emerging-territories",
        "Emerging Territories",
        "territory distribution exists, but at least two snapshots are required before naming an emerging territory."
      ),
    ];
  },
};

export const audienceContentAlignmentRule: Rule = {
  id: "audience-content-alignment",
  description: "Checks alignment between audience concentration and content matching evidence.",
  evaluate({ datasets, metrics, contents }): Insight[] {
    const summary = audienceSummaries(datasets, metrics).find(
      (entry) => entry.genderDistribution.length > 0
    );
    if (!summary) return [];

    const primary = summary.genderDistribution[0];
    if (!primary) return [];

    if (contents.length === 0) {
      return [
        lowConfidenceInsight(
          "audience-content-alignment",
          "Audience/Content Alignment",
          `audience is led by ${primary.label} (${Math.round(primary.value * 100)}%), but content strategy cannot be validated without imported contents.`
        ),
      ];
    }

    const unmatchedContents = contents.filter((content) => !content.book_id).length;
    const unmatchedRatio = unmatchedContents / contents.length;
    const mismatched = primary.value >= 0.6 && unmatchedRatio >= 0.3;

    return [
      {
        id: `audience-content-alignment:${summary.datasetId}`,
        ruleId: "audience-content-alignment",
        severity: mismatched ? "warning" : "info",
        title: "Audience/Content Alignment",
        message: mismatched
          ? `Alignment risk: ${primary.label} concentrates ${Math.round(primary.value * 100)}% of audience while ${Math.round(unmatchedRatio * 100)}% of contents remain unlinked.`
          : `No strong misalignment from available evidence: ${primary.label} leads audience (${Math.round(primary.value * 100)}%) and ${Math.round((1 - unmatchedRatio) * 100)}% of contents are linked.`,
      },
    ];
  },
};
