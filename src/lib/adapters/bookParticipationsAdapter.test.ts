import { describe, expect, it } from "vitest";
import { buildParticipationChecklist, type BookParticipationsSummary } from "./bookParticipationsAdapter";

function makeSummary(overrides: Partial<BookParticipationsSummary> = {}): BookParticipationsSummary {
  return {
    contentCount: 0,
    hasVideoContent: false,
    campaigns: [],
    ratingsCount: 0,
    ratingsAverage: null,
    clubAppearances: [],
    recommendationHistory: [],
    isCurrentRecommendation: false,
    ...overrides,
  };
}

describe("buildParticipationChecklist", () => {
  it("retorna lista vazia quando o livro não participa de nada", () => {
    expect(buildParticipationChecklist("book-1", makeSummary())).toEqual([]);
  });

  it("inclui um item por campanha, sem duplicar", () => {
    const summary = makeSummary({
      campaigns: [
        { id: "camp-1", name: "Encha seu Kindle", slug: "encha-seu-kindle" },
        { id: "camp-2", name: "Entrou na Mira", slug: "entrou-na-mira" },
      ],
    });

    const items = buildParticipationChecklist("book-1", summary);

    expect(items).toEqual([
      { key: "campaign:camp-1", label: "Campanha Encha seu Kindle", href: "/admin/campaigns/camp-1" },
      { key: "campaign:camp-2", label: "Campanha Entrou na Mira", href: "/admin/campaigns/camp-2" },
    ]);
  });

  it("agrupa aparições do Clube por ano, mesmo com vários meses no mesmo ano", () => {
    const summary = makeSummary({
      clubAppearances: [
        { yearId: "year-2027", monthId: "month-1", year: 2027, month: 1, createdAt: "2027-01-01T00:00:00.000Z" },
        { yearId: "year-2027", monthId: "month-6", year: 2027, month: 6, createdAt: "2027-06-01T00:00:00.000Z" },
      ],
    });

    const items = buildParticipationChecklist("book-1", summary);

    expect(items).toEqual([
      { key: "club:year-2027", label: "Clube Literário 2027", href: "/admin/bookclub/year-2027" },
    ]);
  });

  it("usa o título do ano do Clube quando disponível, em vez do rótulo genérico", () => {
    const summary = makeSummary({
      clubAppearances: [
        {
          yearId: "year-2027",
          monthId: "month-1",
          year: 2027,
          month: 1,
          yearTitle: "Temporada 2027",
          createdAt: "2027-01-01T00:00:00.000Z",
        },
      ],
    });

    const items = buildParticipationChecklist("book-1", summary);

    expect(items).toEqual([
      { key: "club:year-2027", label: "Temporada 2027", href: "/admin/bookclub/year-2027" },
    ]);
  });

  it("mostra recomendação atual com rótulo diferente de uma recomendação passada", () => {
    const recommendationRecord = {
      id: "rec-1",
      book_reading_id: "reading-1",
      book_id: "book-1",
      started_at: "2027-01-01T00:00:00.000Z",
      ended_at: null,
      created_at: "2027-01-01T00:00:00.000Z",
    };

    const current = buildParticipationChecklist(
      "book-1",
      makeSummary({ recommendationHistory: [recommendationRecord], isCurrentRecommendation: true })
    );
    expect(current).toEqual([
      { key: "recommendations", label: "Recomendação do mês (atual)", href: "/admin/recommendations" },
    ]);

    const past = buildParticipationChecklist(
      "book-1",
      makeSummary({
        recommendationHistory: [{ ...recommendationRecord, ended_at: "2027-02-01T00:00:00.000Z" }],
        isCurrentRecommendation: false,
      })
    );
    expect(past).toEqual([
      { key: "recommendations", label: "Já foi recomendação do mês", href: "/admin/recommendations" },
    ]);
  });

  it("formata conteúdos e avaliações no singular e no plural, incluindo bookId no link de conteúdos", () => {
    const singular = buildParticipationChecklist(
      "book-42",
      makeSummary({ contentCount: 1, ratingsCount: 1, ratingsAverage: 5 })
    );
    expect(singular).toEqual([
      { key: "contents", label: "1 conteúdo publicado", href: "/admin/content?bookId=book-42" },
      { key: "ratings", label: "1 avaliação (5.0★)", href: "/admin/ratings" },
    ]);

    const plural = buildParticipationChecklist(
      "book-42",
      makeSummary({ contentCount: 3, ratingsCount: 12, ratingsAverage: 4.6 })
    );
    expect(plural).toEqual([
      { key: "contents", label: "3 conteúdos publicados", href: "/admin/content?bookId=book-42" },
      { key: "ratings", label: "12 avaliações (4.6★)", href: "/admin/ratings" },
    ]);
  });

  it("omite avaliações sem nota média (ratingsAverage nulo)", () => {
    const items = buildParticipationChecklist("book-1", makeSummary({ ratingsCount: 2, ratingsAverage: null }));
    expect(items).toEqual([{ key: "ratings", label: "2 avaliações", href: "/admin/ratings" }]);
  });
});
