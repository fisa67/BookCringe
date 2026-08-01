import { describe, expect, it } from "vitest";
import { DAYS_WITHOUT_RATING_THRESHOLD, neverRatedAfterFinishedRule } from "./neverRatedAfterFinished";
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

describe("neverRatedAfterFinishedRule", () => {
  it("não dispara quando o livro já tem avaliações", () => {
    const insights = neverRatedAfterFinishedRule.evaluate(
      makeContext({
        reading: makeReading({ finished_at: "2027-01-01T00:00:00.000Z" }),
        participations: { ...makeContext().participations, ratingsCount: 1 },
      })
    );
    expect(insights).toEqual([]);
  });

  it("não dispara para leitura ainda não concluída", () => {
    const insights = neverRatedAfterFinishedRule.evaluate(
      makeContext({ reading: makeReading({ status: "reading", finished_at: undefined }) })
    );
    expect(insights).toEqual([]);
  });

  it(`não dispara antes de completar ${DAYS_WITHOUT_RATING_THRESHOLD} dias sem avaliação`, () => {
    const insights = neverRatedAfterFinishedRule.evaluate(
      makeContext({ reading: makeReading({ finished_at: "2027-05-15T00:00:00.000Z" }) })
    );
    expect(insights).toEqual([]);
  });

  it(`dispara após ${DAYS_WITHOUT_RATING_THRESHOLD} dias sem nenhuma avaliação`, () => {
    const insights = neverRatedAfterFinishedRule.evaluate(
      makeContext({ reading: makeReading({ finished_at: "2027-01-01T00:00:00.000Z" }) })
    );

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "never-rated-after-finished:book-1",
      ruleId: "never-rated-after-finished",
      severity: "warning",
      actionHref: "/livro/quando",
      actionExternal: true,
    });
  });
});
