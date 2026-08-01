import { describe, expect, it } from "vitest";
import { importStaleDatasetDecision } from "@/lib/intelligence/decisions/rules/importStaleDataset";
import { STALE_DATASET_THRESHOLD_DAYS } from "@/lib/intelligence/insights";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function staleDatasetAnswer(data: StaleDatasetAnswerData | null): QuestionAnswer<StaleDatasetAnswerData> {
  return {
    questionId: "stale-dataset",
    question: "Qual é o Dataset mais desatualizado?",
    answeredAt: NOW.toISOString(),
    hasAnswer: data !== null,
    data,
    summary: data
      ? `O Dataset mais desatualizado é "${data.datasetName}", sem uma nova importação há ${data.daysSinceLastImport} dia(s).`
      : "Nenhum Dataset tem um Import registrado ainda.",
  };
}

function contextWith(staleDataset: QuestionAnswer<StaleDatasetAnswerData>): DecisionContext {
  return {
    now: NOW,
    bestContent: { questionId: "best-content", question: "", answeredAt: NOW.toISOString(), hasAnswer: false, data: null, summary: "" },
    staleDataset,
    unmatchedContent: {
      questionId: "unmatched-content",
      question: "",
      answeredAt: NOW.toISOString(),
      hasAnswer: false,
      data: null,
      summary: "",
    },
  };
}

function dataFor(days: number): StaleDatasetAnswerData {
  return {
    datasetId: "dataset-1",
    datasetName: "YouTube Studio — Desempenho de vídeos",
    platform: "youtube",
    daysSinceLastImport: days,
    lastImportAt: "2026-06-01T00:00:00.000Z",
  };
}

describe("importStaleDatasetDecision", () => {
  it("não gera decisão quando staleDataset não tem resposta", () => {
    const decisions = importStaleDatasetDecision.evaluate(contextWith(staleDatasetAnswer(null)));
    expect(decisions).toEqual([]);
  });

  it(`não gera decisão quando o Dataset mais desatualizado tem menos de ${STALE_DATASET_THRESHOLD_DAYS} dias`, () => {
    const decisions = importStaleDatasetDecision.evaluate(
      contextWith(staleDatasetAnswer(dataFor(STALE_DATASET_THRESHOLD_DAYS - 1)))
    );
    expect(decisions).toEqual([]);
  });

  it(`gera decisão de prioridade média quando o Dataset tem ${STALE_DATASET_THRESHOLD_DAYS} dias ou mais`, () => {
    const decisions = importStaleDatasetDecision.evaluate(
      contextWith(staleDatasetAnswer(dataFor(STALE_DATASET_THRESHOLD_DAYS)))
    );

    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ id: "import-stale-dataset", priority: "medium" });
    expect(decisions[0]?.description).toContain("YouTube Studio — Desempenho de vídeos");
    expect(decisions[0]?.rationale).toContain("Qual é o Dataset mais desatualizado?");
  });

  it(`gera decisão de prioridade alta quando o Dataset tem ${STALE_DATASET_THRESHOLD_DAYS * 2} dias ou mais`, () => {
    const decisions = importStaleDatasetDecision.evaluate(
      contextWith(staleDatasetAnswer(dataFor(STALE_DATASET_THRESHOLD_DAYS * 2)))
    );

    expect(decisions[0]?.priority).toBe("high");
  });

  it("toda decisão contém título, descrição, prioridade, ação recomendada e justificativa", () => {
    const [decision] = importStaleDatasetDecision.evaluate(
      contextWith(staleDatasetAnswer(dataFor(STALE_DATASET_THRESHOLD_DAYS)))
    );

    expect(decision).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      priority: expect.any(String),
      recommendedAction: expect.any(String),
      rationale: expect.any(String),
    });
  });
});
