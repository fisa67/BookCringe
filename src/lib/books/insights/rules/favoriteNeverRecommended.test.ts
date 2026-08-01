import { describe, expect, it } from "vitest";
import { favoriteNeverRecommendedRule } from "./favoriteNeverRecommended";
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

describe("favoriteNeverRecommendedRule", () => {
  it("não dispara para um livro que não é favorito nem recomendado", () => {
    expect(favoriteNeverRecommendedRule.evaluate(makeContext())).toEqual([]);
  });

  it("não dispara quando o livro já teve algum período como recomendação do mês", () => {
    const insights = favoriteNeverRecommendedRule.evaluate(
      makeContext({
        reading: makeReading({ favorite: true }),
        participations: {
          ...makeContext().participations,
          recommendationHistory: [
            {
              id: "rec-1",
              book_reading_id: "reading-1",
              book_id: "book-1",
              started_at: "2027-01-01T00:00:00.000Z",
              ended_at: "2027-02-01T00:00:00.000Z",
              created_at: "2027-01-01T00:00:00.000Z",
            },
          ],
        },
      })
    );
    expect(insights).toEqual([]);
  });

  it("dispara para um favorito que nunca foi recomendação do mês, sem actionHref", () => {
    const insights = favoriteNeverRecommendedRule.evaluate(makeContext({ reading: makeReading({ favorite: true }) }));

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "favorite-never-recommended:book-1",
      ruleId: "favorite-never-recommended",
    });
    expect(insights[0].actionHref).toBeUndefined();
  });
});
