import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { Question } from "@/lib/intelligence/questions/types";
import {
  audienceSummaries,
  compareAudienceDistributions,
  leadingPositiveDelta,
  secondaryMeaningfulSegment,
  type AudienceEvidenceConfidence,
} from "@/lib/intelligence/audience/signals";

export interface AudienceStrategyQuestionContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  metrics: IntelligenceMetricRecord[];
  contents: IntelligenceContentRecord[];
}

interface AudienceStrategyAnswerBase {
  datasetId: string;
  datasetName: string;
  platform: ImportPlatform;
  confidence: AudienceEvidenceConfidence;
}

export interface FastestGrowingSegmentAnswerData extends AudienceStrategyAnswerBase {
  segment: string;
  shareDelta: number;
  currentShare: number;
}

export interface UnderservedSegmentAnswerData extends AudienceStrategyAnswerBase {
  segment: string;
  share: number;
  primarySegment: string;
  primaryShare: number;
  contentsCount: number;
}

export interface TerritoryGrowthOpportunityAnswerData extends AudienceStrategyAnswerBase {
  territory: string;
  shareDelta: number;
  currentShare: number;
}

export interface AudienceContentMismatchAnswerData extends AudienceStrategyAnswerBase {
  mismatched: boolean;
  primarySegment?: string;
  primaryShare?: number;
  contentsCount: number;
  unmatchedContents: number;
  unmatchedRatio: number;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const fastestGrowingSegmentQuestion: Question<
  AudienceStrategyQuestionContext,
  FastestGrowingSegmentAnswerData
> = {
  id: "audience-fastest-growing-segment",
  question: "Which audience segment is growing fastest?",
  answer(context) {
    const comparisons = compareAudienceDistributions(context.datasets, context.metrics, "gender");
    const comparison = comparisons
      .map((entry) => ({ entry, leader: leadingPositiveDelta(entry) }))
      .filter((candidate) => candidate.leader)
      .sort((a, b) => (b.leader?.delta ?? 0) - (a.leader?.delta ?? 0))[0];

    if (comparison?.leader) {
      const data: FastestGrowingSegmentAnswerData = {
        datasetId: comparison.entry.datasetId,
        datasetName: comparison.entry.datasetName,
        platform: comparison.entry.platform,
        confidence: "high",
        segment: comparison.leader.label,
        shareDelta: comparison.leader.delta,
        currentShare: comparison.leader.currentShare,
      };

      return {
        questionId: "audience-fastest-growing-segment",
        question: "Which audience segment is growing fastest?",
        answeredAt: context.now.toISOString(),
        hasAnswer: true,
        data,
        summary: `${data.segment} is growing fastest (+${percent(data.shareDelta)} share between the latest audience snapshots).`,
      };
    }

    const summary = audienceSummaries(context.datasets, context.metrics).find(
      (entry) => entry.genderDistribution.length > 0
    );
    const leader = summary?.genderDistribution[0];
    if (!summary || !leader) {
      return {
        questionId: "audience-fastest-growing-segment",
        question: "Which audience segment is growing fastest?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient gender snapshots to identify a growing audience segment.",
      };
    }

    const data: FastestGrowingSegmentAnswerData = {
      datasetId: summary.datasetId,
      datasetName: summary.datasetName,
      platform: summary.platform,
      confidence: "low",
      segment: leader.label,
      shareDelta: 0,
      currentShare: leader.value,
    };

    return {
      questionId: "audience-fastest-growing-segment",
      question: "Which audience segment is growing fastest?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary: `Low confidence: only one gender snapshot is available. ${data.segment} currently leads with ${percent(data.currentShare)}, but growth cannot be measured yet.`,
    };
  },
};

export const underservedSegmentQuestion: Question<
  AudienceStrategyQuestionContext,
  UnderservedSegmentAnswerData
> = {
  id: "audience-underserved-segment",
  question: "Which audience segment appears underserved by current content?",
  answer(context) {
    const summary = audienceSummaries(context.datasets, context.metrics).find(
      (entry) => entry.genderDistribution.length > 0
    );
    const primary = summary?.genderDistribution[0];
    const secondary = summary ? secondaryMeaningfulSegment(summary.genderDistribution) : null;

    if (!summary || !primary || !secondary) {
      return {
        questionId: "audience-underserved-segment",
        question: "Which audience segment appears underserved by current content?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient audience-segment evidence to identify an underserved group.",
      };
    }

    const contentsCount = context.contents.length;
    const confidence: AudienceEvidenceConfidence = contentsCount > 0 ? "high" : "low";
    const data: UnderservedSegmentAnswerData = {
      datasetId: summary.datasetId,
      datasetName: summary.datasetName,
      platform: summary.platform,
      confidence,
      segment: secondary.label,
      share: secondary.value,
      primarySegment: primary.label,
      primaryShare: primary.value,
      contentsCount,
    };

    return {
      questionId: "audience-underserved-segment",
      question: "Which audience segment appears underserved by current content?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        confidence === "high"
          ? `${data.segment} (${percent(data.share)}) is a meaningful secondary audience behind ${data.primarySegment} (${percent(data.primaryShare)}) while ${data.contentsCount} content item(s) already exist — a candidate underserved segment.`
          : `Low confidence: ${data.segment} is a meaningful secondary audience (${percent(data.share)}), but there is no imported content yet to confirm under-service.`,
    };
  },
};

export const territoryGrowthOpportunityQuestion: Question<
  AudienceStrategyQuestionContext,
  TerritoryGrowthOpportunityAnswerData
> = {
  id: "audience-territory-growth-opportunity",
  question: "Which territory shows the strongest growth opportunity?",
  answer(context) {
    const comparisons = compareAudienceDistributions(context.datasets, context.metrics, "territory");
    const comparison = comparisons
      .map((entry) => ({
        entry,
        leader: leadingPositiveDelta(entry, { excludeLabels: ["Others"] }),
      }))
      .filter((candidate) => candidate.leader)
      .sort((a, b) => (b.leader?.delta ?? 0) - (a.leader?.delta ?? 0))[0];

    if (comparison?.leader) {
      const data: TerritoryGrowthOpportunityAnswerData = {
        datasetId: comparison.entry.datasetId,
        datasetName: comparison.entry.datasetName,
        platform: comparison.entry.platform,
        confidence: "high",
        territory: comparison.leader.label,
        shareDelta: comparison.leader.delta,
        currentShare: comparison.leader.currentShare,
      };

      return {
        questionId: "audience-territory-growth-opportunity",
        question: "Which territory shows the strongest growth opportunity?",
        answeredAt: context.now.toISOString(),
        hasAnswer: true,
        data,
        summary: `${data.territory} shows the strongest growth opportunity (+${percent(data.shareDelta)} share between the latest territory snapshots).`,
      };
    }

    const summary = audienceSummaries(context.datasets, context.metrics).find(
      (entry) => entry.territoryDistribution.length > 0
    );
    const opportunity =
      summary &&
      (secondaryMeaningfulSegment(
        summary.territoryDistribution.filter((entry) => entry.label !== "Others"),
        0.05
      ) ??
        summary.territoryDistribution.find((entry) => entry.label !== "Others"));

    if (!summary || !opportunity) {
      return {
        questionId: "audience-territory-growth-opportunity",
        question: "Which territory shows the strongest growth opportunity?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient territory snapshots to identify a growth opportunity.",
      };
    }

    const data: TerritoryGrowthOpportunityAnswerData = {
      datasetId: summary.datasetId,
      datasetName: summary.datasetName,
      platform: summary.platform,
      confidence: "low",
      territory: opportunity.label,
      shareDelta: 0,
      currentShare: opportunity.value,
    };

    return {
      questionId: "audience-territory-growth-opportunity",
      question: "Which territory shows the strongest growth opportunity?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary: `Low confidence: only one territory snapshot is available. ${data.territory} currently holds ${percent(data.currentShare)}, but growth cannot be measured yet.`,
    };
  },
};

export const audienceContentMismatchQuestion: Question<
  AudienceStrategyQuestionContext,
  AudienceContentMismatchAnswerData
> = {
  id: "audience-content-mismatch",
  question: "Is there a mismatch between audience profile and content strategy?",
  answer(context) {
    const summary = audienceSummaries(context.datasets, context.metrics).find(
      (entry) => entry.genderDistribution.length > 0
    );
    const contentsCount = context.contents.length;
    const unmatchedContents = context.contents.filter((content) => !content.book_id).length;
    const unmatchedRatio = contentsCount === 0 ? 0 : unmatchedContents / contentsCount;

    if (!summary) {
      return {
        questionId: "audience-content-mismatch",
        question: "Is there a mismatch between audience profile and content strategy?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient audience profile data to assess content-strategy alignment.",
      };
    }

    const primary = summary.genderDistribution[0];
    if (!primary) {
      return {
        questionId: "audience-content-mismatch",
        question: "Is there a mismatch between audience profile and content strategy?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient audience profile data to assess content-strategy alignment.",
      };
    }

    if (contentsCount === 0) {
      const data: AudienceContentMismatchAnswerData = {
        datasetId: summary.datasetId,
        datasetName: summary.datasetName,
        platform: summary.platform,
        confidence: "low",
        mismatched: true,
        primarySegment: primary.label,
        primaryShare: primary.value,
        contentsCount: 0,
        unmatchedContents: 0,
        unmatchedRatio: 0,
      };

      return {
        questionId: "audience-content-mismatch",
        question: "Is there a mismatch between audience profile and content strategy?",
        answeredAt: context.now.toISOString(),
        hasAnswer: true,
        data,
        summary: `Low confidence: audience profile is led by ${primary.label} (${percent(primary.value)}), but no content imports exist to validate strategy alignment.`,
      };
    }

    const mismatched = primary.value >= 0.6 && unmatchedRatio >= 0.3;
    const data: AudienceContentMismatchAnswerData = {
      datasetId: summary.datasetId,
      datasetName: summary.datasetName,
      platform: summary.platform,
      confidence: "high",
      mismatched,
      primarySegment: primary.label,
      primaryShare: primary.value,
      contentsCount,
      unmatchedContents,
      unmatchedRatio,
    };

    return {
      questionId: "audience-content-mismatch",
      question: "Is there a mismatch between audience profile and content strategy?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary: mismatched
        ? `Yes. Audience is concentrated in ${primary.label} (${percent(primary.value)}) while ${percent(unmatchedRatio)} of contents remain unlinked to books.`
        : `No clear mismatch from available evidence: audience is led by ${primary.label} (${percent(primary.value)}) and ${percent(1 - unmatchedRatio)} of contents are already linked.`,
    };
  },
};
