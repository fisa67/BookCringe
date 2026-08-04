import { describe, expect, it } from "vitest";
import {
  exploreGrowingTerritoryDecision,
  increaseFocusOnGrowingSegmentDecision,
  rebalancePublishingStrategyDecision,
  testFormatForUnderservedSegmentDecision,
} from "@/lib/intelligence/decisions/rules/audienceStrategy";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";
import type {
  AudienceContentMismatchAnswerData,
  FastestGrowingSegmentAnswerData,
  TerritoryGrowthOpportunityAnswerData,
  UnderservedSegmentAnswerData,
} from "@/lib/intelligence/questions/audienceStrategy";

const NOW = new Date("2026-08-04T12:00:00.000Z");

function answer<T>(questionId: string, data: T): QuestionAnswer<T> {
  return {
    questionId,
    question: questionId,
    answeredAt: NOW.toISOString(),
    hasAnswer: true,
    data,
    summary: "audience strategy answer",
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
  fastestGrowingSegment: answer<FastestGrowingSegmentAnswerData>("audience-fastest-growing-segment", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram",
    confidence: "high",
    segment: "Mulheres",
    shareDelta: 0.07,
    currentShare: 0.62,
  }),
  underservedSegment: answer<UnderservedSegmentAnswerData>("audience-underserved-segment", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram",
    confidence: "high",
    segment: "Homens",
    share: 0.32,
    primarySegment: "Mulheres",
    primaryShare: 0.68,
    contentsCount: 4,
  }),
  territoryGrowthOpportunity: answer<TerritoryGrowthOpportunityAnswerData>(
    "audience-territory-growth-opportunity",
    {
      datasetId: "instagram-audience",
      datasetName: "Instagram — Audiência",
      platform: "instagram",
      confidence: "high",
      territory: "MX",
      shareDelta: 0.1,
      currentShare: 0.2,
    }
  ),
  audienceContentMismatch: answer<AudienceContentMismatchAnswerData>("audience-content-mismatch", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram",
    confidence: "high",
    mismatched: true,
    primarySegment: "Mulheres",
    primaryShare: 0.72,
    contentsCount: 3,
    unmatchedContents: 2,
    unmatchedRatio: 2 / 3,
  }),
} satisfies DecisionContext;

describe("Audience Strategy Decisions", () => {
  it("derives exactly the four strategy decisions from the new questions", () => {
    expect(increaseFocusOnGrowingSegmentDecision.evaluate(context)[0]?.title).toContain("Mulheres");
    expect(testFormatForUnderservedSegmentDecision.evaluate(context)[0]?.title).toContain("Homens");
    expect(exploreGrowingTerritoryDecision.evaluate(context)[0]?.title).toContain("MX");
    expect(rebalancePublishingStrategyDecision.evaluate(context)[0]?.id).toBe(
      "rebalance-publishing-strategy"
    );
  });

  it("does not rebalance when mismatch is absent", () => {
    const aligned = {
      ...context,
      audienceContentMismatch: answer<AudienceContentMismatchAnswerData>("audience-content-mismatch", {
        ...context.audienceContentMismatch!.data!,
        mismatched: false,
      }),
    };

    expect(rebalancePublishingStrategyDecision.evaluate(aligned)).toEqual([]);
  });
});
