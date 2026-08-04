import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { Question } from "@/lib/intelligence/questions/types";
import {
  correlateContentThemesToGrowth,
  correlateContentToAcquisition,
  correlateContentToEngagement,
  correlateContentToRetention,
  type ContentEngagementFormat,
  type ContentPerformanceConfidence,
} from "@/lib/intelligence/contentPerformance/correlations";

export interface ContentPerformanceQuestionContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books: CmsBookRecord[];
}

interface ContentPerformanceAnswerBase {
  contentId: string;
  title: string;
  theme: string;
  platform: ImportPlatform;
  score: number;
  confidence: ContentPerformanceConfidence;
}

export type GrowthThemeAnswerData = ContentPerformanceAnswerBase;

export type EngagementFormatAnswerData = ContentPerformanceAnswerBase & {
  format: ContentEngagementFormat;
};

export type AudienceAcquisitionContentAnswerData = ContentPerformanceAnswerBase;

export type RetentionContentAnswerData = ContentPerformanceAnswerBase;

export const growthThemeQuestion: Question<
  ContentPerformanceQuestionContext,
  GrowthThemeAnswerData
> = {
  id: "content-growth-themes",
  question: "Which content themes generate the highest audience growth?",
  answer(context) {
    const result = correlateContentThemesToGrowth(context);
    if (!result) {
      return {
        questionId: "content-growth-themes",
        question: "Which content themes generate the highest audience growth?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient content/audience evidence to identify growth themes.",
      };
    }

    const data: GrowthThemeAnswerData = {
      contentId: result.contentId,
      title: result.title,
      theme: result.theme,
      platform: result.platform,
      score: result.score,
      confidence: result.confidence,
    };

    return {
      questionId: "content-growth-themes",
      question: "Which content themes generate the highest audience growth?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        result.confidence === "high"
          ? `Theme "${data.theme}" currently associates with the highest audience-growth signals (subscriber gains ${data.score}).`
          : `Low confidence: theme "${data.theme}" leads available subscriber gains (${data.score}), but growth evidence remains incomplete.`,
    };
  },
};

export const engagementFormatQuestion: Question<
  ContentPerformanceQuestionContext,
  EngagementFormatAnswerData
> = {
  id: "content-engagement-formats",
  question: "Which content formats drive the highest engagement?",
  answer(context) {
    const result = correlateContentToEngagement(context);
    if (!result?.format) {
      return {
        questionId: "content-engagement-formats",
        question: "Which content formats drive the highest engagement?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient content metrics to identify an engagement-driving format.",
      };
    }

    const data: EngagementFormatAnswerData = {
      contentId: result.contentId,
      title: result.title,
      theme: result.theme,
      platform: result.platform,
      score: result.score,
      confidence: result.confidence,
      format: result.format,
    };

    return {
      questionId: "content-engagement-formats",
      question: "Which content formats drive the highest engagement?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        result.confidence === "high"
          ? `Format "${data.format}" drives the highest engagement, exemplified by "${data.title}".`
          : `Low confidence: format "${data.format}" leads with limited content evidence (exemplar "${data.title}").`,
    };
  },
};

export const audienceAcquisitionContentQuestion: Question<
  ContentPerformanceQuestionContext,
  AudienceAcquisitionContentAnswerData
> = {
  id: "content-audience-acquisition",
  question: "Which content attracts new audience segments?",
  answer(context) {
    const result = correlateContentToAcquisition(context);
    if (!result) {
      return {
        questionId: "content-audience-acquisition",
        question: "Which content attracts new audience segments?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient acquisition evidence across content and audience datasets.",
      };
    }

    const data: AudienceAcquisitionContentAnswerData = {
      contentId: result.contentId,
      title: result.title,
      theme: result.theme,
      platform: result.platform,
      score: result.score,
      confidence: result.confidence,
    };

    return {
      questionId: "content-audience-acquisition",
      question: "Which content attracts new audience segments?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        result.confidence === "high"
          ? `"${data.title}" leads acquisition signals with ${data.score} subscriber gains alongside audience growth.`
          : `Low confidence: "${data.title}" leads subscriber gains (${data.score}), but audience-acquisition linkage is incomplete.`,
    };
  },
};

export const retentionContentQuestion: Question<
  ContentPerformanceQuestionContext,
  RetentionContentAnswerData
> = {
  id: "content-retention-effect",
  question: "Which content has the strongest retention effect?",
  answer(context) {
    const result = correlateContentToRetention(context);
    if (!result) {
      return {
        questionId: "content-retention-effect",
        question: "Which content has the strongest retention effect?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Insufficient watch-time/retention evidence to answer.",
      };
    }

    const data: RetentionContentAnswerData = {
      contentId: result.contentId,
      title: result.title,
      theme: result.theme,
      platform: result.platform,
      score: result.score,
      confidence: result.confidence,
    };

    return {
      questionId: "content-retention-effect",
      question: "Which content has the strongest retention effect?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        result.confidence === "high"
          ? `"${data.title}" shows the strongest retention effect via watch time (${data.score}h).`
          : `Low confidence: "${data.title}" leads watch time (${data.score}h), but retention evidence is still thin.`,
    };
  },
};
