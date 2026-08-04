import { describe, expect, it } from "vitest";
import { reallocateCampaignBudgetDecision } from "@/lib/intelligence/decisions/rules/campaignEfficiency";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { LowestCostPerFollowerAnswerData } from "@/lib/intelligence/questions/campaign";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function noAnswer<T>(questionId: string): QuestionAnswer<T> {
  return { questionId, question: "", answeredAt: NOW.toISOString(), hasAnswer: false, data: null, summary: "" };
}

const BASE_CONTEXT: DecisionContext = {
  now: NOW,
  bestContent: noAnswer<BestContentAnswerData>("best-content"),
  staleDataset: noAnswer<StaleDatasetAnswerData>("stale-dataset"),
  unmatchedContent: noAnswer<UnmatchedContentAnswerData>("unmatched-content"),
};

describe("reallocateCampaignBudgetDecision", () => {
  it("não gera decisão quando lowestCostPerFollower não tem resposta", () => {
    const decisions = reallocateCampaignBudgetDecision.evaluate({
      ...BASE_CONTEXT,
      lowestCostPerFollower: noAnswer("campaign-lowest-cost-per-follower"),
    });

    expect(decisions).toEqual([]);
  });

  it("recomenda realocar orçamento para a campanha mais eficiente, com prioridade média quando há high confidence", () => {
    const data: LowestCostPerFollowerAnswerData = {
      datasetId: "tiktok-promotions",
      datasetName: "TikTok — Promoções",
      platform: "tiktok",
      confidence: "high",
      campaign: "Promoção de 2026-07-01",
      adCostBrl: 1200,
      costPerFollower: 1.67,
      newFollowers: 720,
    };

    const decisions = reallocateCampaignBudgetDecision.evaluate({
      ...BASE_CONTEXT,
      lowestCostPerFollower: {
        ...noAnswer("campaign-lowest-cost-per-follower"),
        hasAnswer: true,
        data,
        summary: "Promoção de 2026-07-01 tem o menor custo por seguidor.",
      },
    });

    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      id: "reallocate-campaign-budget",
      priority: "medium",
      title: "Realocar orçamento para Promoção de 2026-07-01",
    });
    expect(decisions[0].rationale).toContain("Promoção de 2026-07-01 tem o menor custo por seguidor.");
  });

  it("usa prioridade baixa quando a resposta tem low confidence", () => {
    const data: LowestCostPerFollowerAnswerData = {
      datasetId: "tiktok-promotions",
      datasetName: "TikTok — Promoções",
      platform: "tiktok",
      confidence: "low",
      campaign: "Promoção de 2026-07-01",
      adCostBrl: 1200,
      costPerFollower: 1.67,
      newFollowers: 720,
    };

    const decisions = reallocateCampaignBudgetDecision.evaluate({
      ...BASE_CONTEXT,
      lowestCostPerFollower: {
        ...noAnswer("campaign-lowest-cost-per-follower"),
        hasAnswer: true,
        data,
        summary: "Apenas uma campanha disponível.",
      },
    });

    expect(decisions[0].priority).toBe("low");
  });
});
