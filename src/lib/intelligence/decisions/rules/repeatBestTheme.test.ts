import { describe, expect, it } from "vitest";
import { repeatBestThemeDecision } from "@/lib/intelligence/decisions/rules/repeatBestTheme";
import type { DecisionContext } from "@/lib/intelligence/decisions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function bestContentAnswer(data: BestContentAnswerData | null): QuestionAnswer<BestContentAnswerData> {
  return {
    questionId: "best-content",
    question: "Qual foi meu melhor conteúdo?",
    answeredAt: NOW.toISOString(),
    hasAnswer: data !== null,
    data,
    summary: data ? `Seu melhor conteúdo foi "${data.title}".` : "Ainda não há conteúdo suficiente.",
  };
}

function emptyContext(overrides: Partial<DecisionContext> = {}): DecisionContext {
  return {
    now: NOW,
    bestContent: bestContentAnswer(null),
    staleDataset: { questionId: "stale-dataset", question: "", answeredAt: NOW.toISOString(), hasAnswer: false, data: null, summary: "" },
    unmatchedContent: {
      questionId: "unmatched-content",
      question: "",
      answeredAt: NOW.toISOString(),
      hasAnswer: false,
      data: null,
      summary: "",
    },
    ...overrides,
  };
}

const BEST_CONTENT_DATA: BestContentAnswerData = {
  contentId: "content-1",
  title: "Como ler mais em 2026",
  platform: "youtube",
  datasetName: "YouTube Studio — Desempenho de vídeos",
  metric: "views",
  value: 15420,
  measuredAt: NOW.toISOString(),
};

describe("repeatBestThemeDecision", () => {
  it("não gera decisão quando bestContent não tem resposta", () => {
    const decisions = repeatBestThemeDecision.evaluate(emptyContext());
    expect(decisions).toEqual([]);
  });

  it("recomenda repetir o tema quando há um melhor conteúdo", () => {
    const decisions = repeatBestThemeDecision.evaluate(
      emptyContext({ bestContent: bestContentAnswer(BEST_CONTENT_DATA) })
    );

    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      id: "repeat-best-theme",
      title: "Repita o que já funcionou",
      priority: "medium",
    });
    expect(decisions[0]?.description).toContain("Como ler mais em 2026");
    expect(decisions[0]?.rationale).toContain("Qual foi meu melhor conteúdo?");
  });

  it("recomenda repetir o tema do Livro quando o Content já está vinculado", () => {
    const decisions = repeatBestThemeDecision.evaluate(
      emptyContext({ bestContent: bestContentAnswer({ ...BEST_CONTENT_DATA, bookTitle: "Como Ler Mais em 2026" }) })
    );

    expect(decisions[0]?.recommendedAction).toContain("Como Ler Mais em 2026");
  });

  it("toda decisão contém título, descrição, prioridade, ação recomendada e justificativa", () => {
    const [decision] = repeatBestThemeDecision.evaluate(
      emptyContext({ bestContent: bestContentAnswer(BEST_CONTENT_DATA) })
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
