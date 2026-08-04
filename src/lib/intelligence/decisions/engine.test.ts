import { describe, expect, it } from "vitest";
import { DECISION_RULES, runDecisionEngine } from "@/lib/intelligence/decisions/engine";
import { STALE_DATASET_THRESHOLD_DAYS } from "@/lib/intelligence/insights";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function noAnswer<T>(questionId: string): QuestionAnswer<T> {
  return { questionId, question: "", answeredAt: NOW.toISOString(), hasAnswer: false, data: null, summary: "" };
}

describe("DECISION_RULES", () => {
  it("lista as decisões de Content e Audience", () => {
    expect(DECISION_RULES.map((rule) => rule.id)).toEqual([
      "repeat-best-theme",
      "import-stale-dataset",
      "complete-matching",
      "respond-to-follower-growth",
      "publish-at-activity-peak",
      "focus-top-audience-territory",
      "serve-primary-audience",
      "increase-focus-on-growing-segment",
      "test-format-for-underserved-segment",
      "explore-growing-territory",
      "rebalance-publishing-strategy",
      "increase-high-growth-themes",
      "prioritize-high-engagement-formats",
      "expand-audience-acquisition-content",
      "reinforce-retention-focused-content",
      "reallocate-campaign-budget",
    ]);
  });
});

describe("runDecisionEngine", () => {
  it("não gera nenhuma decisão quando nenhum QuestionAnswer tem resposta", () => {
    const context: DecisionContext = {
      now: NOW,
      bestContent: noAnswer("best-content"),
      staleDataset: noAnswer("stale-dataset"),
      unmatchedContent: noAnswer("unmatched-content"),
    };

    expect(runDecisionEngine(context)).toEqual([]);
  });

  it("concatena as decisões de todas as regras que dispararem", () => {
    const bestContentData: BestContentAnswerData = {
      contentId: "content-1",
      title: "Como ler mais em 2026",
      platform: "youtube",
      datasetName: "YouTube Studio — Desempenho de vídeos",
      metric: "views",
      value: 15420,
      measuredAt: NOW.toISOString(),
    };

    const staleDatasetData: StaleDatasetAnswerData = {
      datasetId: "dataset-1",
      datasetName: "YouTube Studio — Desempenho de vídeos",
      platform: "youtube",
      daysSinceLastImport: STALE_DATASET_THRESHOLD_DAYS,
      lastImportAt: "2026-06-01T00:00:00.000Z",
    };

    const unmatchedContentData: UnmatchedContentAnswerData = {
      totalContents: 10,
      unmatchedContents: 5,
      unmatchedRatio: 0.5,
    };

    const context: DecisionContext = {
      now: NOW,
      bestContent: { ...noAnswer("best-content"), hasAnswer: true, data: bestContentData, summary: "melhor conteúdo" },
      staleDataset: { ...noAnswer("stale-dataset"), hasAnswer: true, data: staleDatasetData, summary: "dataset desatualizado" },
      unmatchedContent: {
        ...noAnswer("unmatched-content"),
        hasAnswer: true,
        data: unmatchedContentData,
        summary: "conteúdos sem livro",
      },
    };

    const decisions = runDecisionEngine(context);

    expect(decisions.map((decision) => decision.id)).toEqual(
      expect.arrayContaining(["repeat-best-theme", "import-stale-dataset", "complete-matching"])
    );
    expect(decisions).toHaveLength(3);
  });

  it("ordena as decisões por prioridade (high antes de medium antes de low)", () => {
    const bestContentData: BestContentAnswerData = {
      contentId: "content-1",
      title: "Vídeo",
      platform: "youtube",
      datasetName: "Dataset",
      metric: "views",
      value: 100,
      measuredAt: NOW.toISOString(),
    };

    const staleDatasetData: StaleDatasetAnswerData = {
      datasetId: "dataset-1",
      datasetName: "Dataset",
      platform: "youtube",
      daysSinceLastImport: STALE_DATASET_THRESHOLD_DAYS * 2,
      lastImportAt: "2026-01-01T00:00:00.000Z",
    };

    const context: DecisionContext = {
      now: NOW,
      bestContent: { ...noAnswer("best-content"), hasAnswer: true, data: bestContentData, summary: "melhor conteúdo" },
      staleDataset: { ...noAnswer("stale-dataset"), hasAnswer: true, data: staleDatasetData, summary: "dataset desatualizado" },
      unmatchedContent: noAnswer("unmatched-content"),
    };

    const decisions = runDecisionEngine(context);

    expect(decisions[0]?.id).toBe("import-stale-dataset");
    expect(decisions[0]?.priority).toBe("high");
    expect(decisions[1]?.id).toBe("repeat-best-theme");
    expect(decisions[1]?.priority).toBe("medium");
  });
});
