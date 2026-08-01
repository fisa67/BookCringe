import { describe, expect, it } from "vitest";
import { HIGH_RATING_THRESHOLD, noVideoContentRule } from "./noVideoContent";
import type { BookInsightContext } from "@/lib/books/insights/types";

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

function makeReading(overrides: Partial<BookInsightContext["reading"]> = {}): NonNullable<BookInsightContext["reading"]> {
  return {
    rating: undefined,
    favorite: false,
    would_recommend: false,
    status: "finished",
    finished_at: undefined,
    ...overrides,
  };
}

describe("noVideoContentRule", () => {
  it("não dispara quando o livro já tem conteúdo em vídeo", () => {
    const insights = noVideoContentRule.evaluate(
      makeContext({
        participations: { ...makeContext().participations, hasVideoContent: true, isCurrentRecommendation: true },
      })
    );
    expect(insights).toEqual([]);
  });

  it("não dispara para um livro comum, sem sinal de destaque editorial", () => {
    const insights = noVideoContentRule.evaluate(makeContext());
    expect(insights).toEqual([]);
  });

  it("dispara quando é a recomendação atual e não tem conteúdo em vídeo", () => {
    const insights = noVideoContentRule.evaluate(
      makeContext({
        participations: { ...makeContext().participations, isCurrentRecommendation: true },
      })
    );

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "no-video-content:book-1",
      ruleId: "no-video-content",
      severity: "info",
      actionHref: "/admin/content/new?bookId=book-1&platform=instagram&type=reel",
    });
  });

  it("dispara quando é favorito, mesmo sem ser a recomendação atual", () => {
    const insights = noVideoContentRule.evaluate(makeContext({ reading: makeReading({ favorite: true }) }));
    expect(insights).toHaveLength(1);
  });

  it(`dispara quando a nota pessoal é >= ${HIGH_RATING_THRESHOLD}`, () => {
    const insights = noVideoContentRule.evaluate(
      makeContext({ reading: makeReading({ rating: HIGH_RATING_THRESHOLD }) })
    );
    expect(insights).toHaveLength(1);
  });

  it(`não dispara quando a nota pessoal é menor que ${HIGH_RATING_THRESHOLD}`, () => {
    const insights = noVideoContentRule.evaluate(
      makeContext({ reading: makeReading({ rating: HIGH_RATING_THRESHOLD - 1 }) })
    );
    expect(insights).toEqual([]);
  });
});
