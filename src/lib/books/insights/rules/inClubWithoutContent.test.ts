import { describe, expect, it } from "vitest";
import { inClubWithoutContentRule } from "./inClubWithoutContent";
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

const CLUB_APPEARANCE = { yearId: "year-1", monthId: "month-1", year: 2027, month: 1, createdAt: "2027-01-01T00:00:00.000Z" };

describe("inClubWithoutContentRule", () => {
  it("não dispara para um livro fora do Clube", () => {
    expect(inClubWithoutContentRule.evaluate(makeContext())).toEqual([]);
  });

  it("não dispara quando o livro do Clube já tem conteúdo publicado", () => {
    const insights = inClubWithoutContentRule.evaluate(
      makeContext({
        participations: {
          ...makeContext().participations,
          clubAppearances: [CLUB_APPEARANCE],
          contentCount: 1,
        },
      })
    );
    expect(insights).toEqual([]);
  });

  it("dispara para um livro do Clube sem nenhum conteúdo", () => {
    const insights = inClubWithoutContentRule.evaluate(
      makeContext({
        participations: { ...makeContext().participations, clubAppearances: [CLUB_APPEARANCE] },
      })
    );

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "in-club-without-content:book-1",
      ruleId: "in-club-without-content",
      severity: "warning",
      actionHref: "/admin/content/new?bookId=book-1",
    });
  });
});
