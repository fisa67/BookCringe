import { describe, expect, it } from "vitest";
import { buildContextItems } from "@/lib/intelligence/chat/context";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { Insight } from "@/lib/intelligence/insights/types";
import type { Decision } from "@/lib/intelligence/decisions/types";

function answer(overrides: Partial<QuestionAnswer<unknown>> = {}): QuestionAnswer<unknown> {
  return {
    questionId: "best-content",
    question: "Qual foi o conteúdo com melhor desempenho?",
    answeredAt: "2026-01-01T00:00:00.000Z",
    hasAnswer: true,
    data: { some: "data" },
    summary: "O vídeo X teve o melhor desempenho.",
    ...overrides,
  };
}

describe("buildContextItems", () => {
  it("inclui apenas QuestionAnswers com hasAnswer true", () => {
    const items = buildContextItems({
      questionAnswers: [
        answer({ questionId: "a", summary: "Resposta A" }),
        answer({ questionId: "b", hasAnswer: false, data: null, summary: "Sem dado suficiente" }),
        undefined,
      ],
      insights: [],
      decisions: [],
    });

    expect(items).toEqual([
      { id: "question:a", kind: "question", title: expect.any(String), text: "Resposta A" },
    ]);
  });

  it("inclui todos os Insights e Decisions, combinando descrição e ação recomendada", () => {
    const insight: Insight = {
      id: "stale-dataset:dataset-1",
      ruleId: "stale-dataset",
      severity: "warning",
      title: "Dataset desatualizado",
      message: "O Dataset X não é atualizado há 30 dias.",
    };
    const decision: Decision = {
      id: "repeat-best-theme",
      title: "Repita o tema de maior sucesso",
      description: "O tema Y teve o melhor engajamento.",
      priority: "high",
      recommendedAction: "Planeje um novo conteúdo sobre Y.",
      rationale: "best-content",
    };

    const items = buildContextItems({ questionAnswers: [], insights: [insight], decisions: [decision] });

    expect(items).toEqual([
      { id: "insight:stale-dataset:dataset-1", kind: "insight", title: insight.title, text: insight.message },
      {
        id: "decision:repeat-best-theme",
        kind: "decision",
        title: decision.title,
        text: "O tema Y teve o melhor engajamento. Ação recomendada: Planeje um novo conteúdo sobre Y.",
      },
    ]);
  });
});
