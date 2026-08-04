import { describe, expect, it } from "vitest";
import {
  expandAudienceAcquisitionContentDecision,
  increaseHighGrowthThemesDecision,
  prioritizeHighEngagementFormatsDecision,
  reinforceRetentionFocusedContentDecision,
} from "@/lib/intelligence/decisions/rules/contentPerformance";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";
import type {
  AudienceAcquisitionContentAnswerData,
  EngagementFormatAnswerData,
  GrowthThemeAnswerData,
  RetentionContentAnswerData,
} from "@/lib/intelligence/questions/contentPerformance";

const NOW = new Date("2026-08-04T12:00:00.000Z");

function answer<T>(questionId: string, data: T): QuestionAnswer<T> {
  return {
    questionId,
    question: questionId,
    answeredAt: NOW.toISOString(),
    hasAnswer: true,
    data,
    summary: "content performance answer",
  };
}

function noAnswer<T>(questionId: string): QuestionAnswer<T> {
  return {
    questionId,
    question: questionId,
    answeredAt: NOW.toISOString(),
    hasAnswer: false,
    data: null,
    summary: "",
  };
}

const context = {
  now: NOW,
  bestContent: noAnswer<BestContentAnswerData>("best-content"),
  staleDataset: noAnswer<StaleDatasetAnswerData>("stale-dataset"),
  unmatchedContent: noAnswer<UnmatchedContentAnswerData>("unmatched-content"),
  growthTheme: answer<GrowthThemeAnswerData>("content-growth-themes", {
    contentId: "c1",
    title: "A",
    theme: "Tema Forte",
    platform: "youtube",
    score: 30,
    confidence: "high",
  }),
  engagementFormat: answer<EngagementFormatAnswerData>("content-engagement-formats", {
    contentId: "c2",
    title: "B",
    theme: "B",
    platform: "youtube",
    score: 4000,
    confidence: "high",
    format: "reach",
  }),
  audienceAcquisitionContent: answer<AudienceAcquisitionContentAnswerData>(
    "content-audience-acquisition",
    {
      contentId: "c1",
      title: "A",
      theme: "Tema Forte",
      platform: "youtube",
      score: 30,
      confidence: "high",
    }
  ),
  retentionContent: answer<RetentionContentAnswerData>("content-retention-effect", {
    contentId: "c1",
    title: "A",
    theme: "Tema Forte",
    platform: "youtube",
    score: 40,
    confidence: "high",
  }),
} satisfies DecisionContext;

describe("Content Performance Decisions", () => {
  it("derives the four decisions exclusively from the new questions", () => {
    expect(increaseHighGrowthThemesDecision.evaluate(context)[0]?.id).toBe(
      "increase-high-growth-themes"
    );
    expect(prioritizeHighEngagementFormatsDecision.evaluate(context)[0]?.id).toBe(
      "prioritize-high-engagement-formats"
    );
    expect(expandAudienceAcquisitionContentDecision.evaluate(context)[0]?.id).toBe(
      "expand-audience-acquisition-content"
    );
    expect(reinforceRetentionFocusedContentDecision.evaluate(context)[0]?.id).toBe(
      "reinforce-retention-focused-content"
    );
  });

  it("emits nothing without the corresponding question answers", () => {
    const empty = {
      ...context,
      growthTheme: undefined,
      engagementFormat: undefined,
      audienceAcquisitionContent: undefined,
      retentionContent: undefined,
    };

    expect(increaseHighGrowthThemesDecision.evaluate(empty)).toEqual([]);
    expect(prioritizeHighEngagementFormatsDecision.evaluate(empty)).toEqual([]);
    expect(expandAudienceAcquisitionContentDecision.evaluate(empty)).toEqual([]);
    expect(reinforceRetentionFocusedContentDecision.evaluate(empty)).toEqual([]);
  });
});
