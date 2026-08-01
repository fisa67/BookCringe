import { describe, expect, it } from "vitest";
import { BOOK_INSIGHT_RULES, runBookInsightRules } from "./engine";
import type { BookInsightContext } from "./types";

const NOW = new Date("2027-06-01T00:00:00.000Z");

function makeContext(overrides: Partial<BookInsightContext> = {}): BookInsightContext {
  return {
    now: NOW,
    book: { id: "book-1", slug: "quando" },
    reading: null,
    participations: {
      contentCount: 0,
      hasVideoContent: false,
      campaigns: [],
      ratingsCount: 0,
      ratingsAverage: null,
      clubAppearances: [],
      recommendationHistory: [],
      isCurrentRecommendation: false,
    },
    ...overrides,
  };
}

describe("runBookInsightRules", () => {
  it("não retorna nenhum insight para um livro sem nenhum sinal", () => {
    expect(runBookInsightRules(makeContext())).toEqual([]);
  });

  it("roda todas as regras registradas e agrega os resultados", () => {
    const insights = runBookInsightRules(
      makeContext({
        reading: {
          rating: undefined,
          favorite: true,
          would_recommend: false,
          status: "finished",
          finished_at: undefined,
        },
        participations: { ...makeContext().participations, isCurrentRecommendation: true },
      })
    );

    // Favorito + recomendação atual + sem conteúdo em vídeo + sem campanha +
    // nunca foi recomendação do mês (participations não reflete isso ainda
    // no fixture) → mais de uma regra deve disparar ao mesmo tempo.
    expect(insights.length).toBeGreaterThan(1);
    const ruleIds = new Set(insights.map((insight) => insight.ruleId));
    expect(ruleIds.has("no-video-content")).toBe(true);
    expect(ruleIds.has("not-in-any-campaign")).toBe(true);
  });

  it("expõe todas as regras no array BOOK_INSIGHT_RULES", () => {
    expect(BOOK_INSIGHT_RULES.map((rule) => rule.id)).toEqual([
      "no-video-content",
      "not-in-any-campaign",
      "never-rated-after-finished",
      "favorite-never-recommended",
      "in-club-without-content",
    ]);
  });
});
