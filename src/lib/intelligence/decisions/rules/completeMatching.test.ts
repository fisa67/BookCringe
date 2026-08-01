import { describe, expect, it } from "vitest";
import { completeMatchingDecision } from "@/lib/intelligence/decisions/rules/completeMatching";
import { UNMATCHED_CONTENT_RATIO_THRESHOLD } from "@/lib/intelligence/insights";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function unmatchedContentAnswer(
  data: UnmatchedContentAnswerData | null
): QuestionAnswer<UnmatchedContentAnswerData> {
  return {
    questionId: "unmatched-content",
    question: "Quanto do meu conteúdo ainda não foi vinculado a um Livro?",
    answeredAt: NOW.toISOString(),
    hasAnswer: data !== null,
    data,
    summary: data
      ? `${data.unmatchedContents} de ${data.totalContents} conteúdo(s) ainda não foram vinculados a um Livro.`
      : "Ainda não há nenhum conteúdo importado.",
  };
}

function contextWith(unmatchedContent: QuestionAnswer<UnmatchedContentAnswerData>): DecisionContext {
  return {
    now: NOW,
    bestContent: { questionId: "best-content", question: "", answeredAt: NOW.toISOString(), hasAnswer: false, data: null, summary: "" },
    staleDataset: {
      questionId: "stale-dataset",
      question: "",
      answeredAt: NOW.toISOString(),
      hasAnswer: false,
      data: null,
      summary: "",
    },
    unmatchedContent,
  };
}

function dataFor(unmatchedContents: number, totalContents: number): UnmatchedContentAnswerData {
  return { totalContents, unmatchedContents, unmatchedRatio: unmatchedContents / totalContents };
}

describe("completeMatchingDecision", () => {
  it("não gera decisão quando unmatchedContent não tem resposta", () => {
    const decisions = completeMatchingDecision.evaluate(contextWith(unmatchedContentAnswer(null)));
    expect(decisions).toEqual([]);
  });

  it(`não gera decisão quando a proporção de não vinculados é menor que ${Math.round(UNMATCHED_CONTENT_RATIO_THRESHOLD * 100)}%`, () => {
    const decisions = completeMatchingDecision.evaluate(contextWith(unmatchedContentAnswer(dataFor(1, 10))));
    expect(decisions).toEqual([]);
  });

  it(`gera decisão de prioridade média quando a proporção atinge ${Math.round(UNMATCHED_CONTENT_RATIO_THRESHOLD * 100)}%`, () => {
    const decisions = completeMatchingDecision.evaluate(contextWith(unmatchedContentAnswer(dataFor(3, 10))));

    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ id: "complete-matching", priority: "medium" });
    expect(decisions[0]?.description).toContain("3 de 10");
    expect(decisions[0]?.rationale).toContain("Quanto do meu conteúdo ainda não foi vinculado a um Livro?");
  });

  it("gera decisão de prioridade alta quando pelo menos metade dos Contents não está vinculada", () => {
    const decisions = completeMatchingDecision.evaluate(contextWith(unmatchedContentAnswer(dataFor(5, 10))));
    expect(decisions[0]?.priority).toBe("high");
  });

  it("toda decisão contém título, descrição, prioridade, ação recomendada e justificativa", () => {
    const [decision] = completeMatchingDecision.evaluate(contextWith(unmatchedContentAnswer(dataFor(5, 10))));

    expect(decision).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      priority: expect.any(String),
      recommendedAction: expect.any(String),
      rationale: expect.any(String),
    });
  });
});
