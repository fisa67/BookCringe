import { describe, expect, it } from "vitest";
import {
  focusTopTerritoryDecision,
  publishAtActivityPeakDecision,
  respondToFollowerGrowthDecision,
  servePrimaryAudienceDecision,
} from "@/lib/intelligence/decisions/rules/audience";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";

const NOW = new Date("2026-08-04T12:00:00.000Z");

function answer<T>(questionId: string, data: T): QuestionAnswer<T> {
  return {
    questionId,
    question: questionId,
    answeredAt: NOW.toISOString(),
    hasAnswer: true,
    data,
    summary: "resposta de audiência",
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
  followerGrowth: answer("audience-follower-growth", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram" as const,
    growth: -12,
    followers: 1800,
    measuredAt: NOW.toISOString(),
  }),
  activityPeak: answer("audience-activity-peak", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram" as const,
    activeFollowers: 920,
    measuredAt: "2026-08-03T20:00:00.000Z",
    hour: 20,
  }),
  topTerritory: answer("audience-top-territory", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram" as const,
    territory: "BR",
    share: 0.71,
  }),
  primaryAudience: answer("audience-primary-segment", {
    datasetId: "instagram-audience",
    datasetName: "Instagram — Audiência",
    platform: "instagram" as const,
    label: "Mulheres",
    share: 0.64,
  }),
} satisfies DecisionContext;

describe("Audience Decisions", () => {
  it("deriva decisões apenas das respostas de Audience", () => {
    expect(respondToFollowerGrowthDecision.evaluate(context)[0]).toMatchObject({
      id: "respond-to-follower-growth",
      priority: "high",
    });
    expect(publishAtActivityPeakDecision.evaluate(context)[0]).toMatchObject({
      id: "publish-at-activity-peak",
      priority: "medium",
    });
    expect(focusTopTerritoryDecision.evaluate(context)[0]?.description).toContain("71%");
    expect(servePrimaryAudienceDecision.evaluate(context)[0]?.description).toContain("Mulheres");
  });

  it("não gera decisão sem resposta da Question correspondente", () => {
    const withoutAudience = {
      ...context,
      followerGrowth: undefined,
      activityPeak: undefined,
      topTerritory: undefined,
      primaryAudience: undefined,
    };

    expect(respondToFollowerGrowthDecision.evaluate(withoutAudience)).toEqual([]);
    expect(publishAtActivityPeakDecision.evaluate(withoutAudience)).toEqual([]);
    expect(focusTopTerritoryDecision.evaluate(withoutAudience)).toEqual([]);
    expect(servePrimaryAudienceDecision.evaluate(withoutAudience)).toEqual([]);
  });
});
