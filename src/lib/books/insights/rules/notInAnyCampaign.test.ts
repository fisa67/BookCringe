import { describe, expect, it } from "vitest";
import { notInAnyCampaignRule } from "./notInAnyCampaign";
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

describe("notInAnyCampaignRule", () => {
  it("não dispara para um livro que não é favorito nem recomendado", () => {
    expect(notInAnyCampaignRule.evaluate(makeContext())).toEqual([]);
  });

  it("não dispara quando o livro já está em pelo menos uma campanha", () => {
    const insights = notInAnyCampaignRule.evaluate(
      makeContext({
        reading: makeReading({ favorite: true }),
        participations: {
          ...makeContext().participations,
          campaigns: [{ id: "camp-1", name: "Entrou na Mira", slug: "entrou-na-mira" }],
        },
      })
    );
    expect(insights).toEqual([]);
  });

  it("dispara para um favorito fora de qualquer campanha", () => {
    const insights = notInAnyCampaignRule.evaluate(makeContext({ reading: makeReading({ favorite: true }) }));

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "not-in-any-campaign:book-1",
      ruleId: "not-in-any-campaign",
      actionHref: "/admin/campaigns?bookId=book-1",
    });
  });

  it("dispara para um livro recomendado (would_recommend) fora de qualquer campanha", () => {
    const insights = notInAnyCampaignRule.evaluate(
      makeContext({ reading: makeReading({ would_recommend: true }) })
    );
    expect(insights).toHaveLength(1);
  });
});
