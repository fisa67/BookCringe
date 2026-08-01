import { describe, expect, it } from "vitest";
import { mergeTimelineEvents, type BookTimelineInputs } from "./bookTimelineAdapter";

function makeInputs(overrides: Partial<BookTimelineInputs> = {}): BookTimelineInputs {
  return {
    bookCreatedAt: "2027-01-01T00:00:00.000Z",
    reading: null,
    recommendationHistory: [],
    contents: [],
    campaignEvents: [],
    clubAppearances: [],
    ratingSummary: null,
    ...overrides,
  };
}

describe("mergeTimelineEvents", () => {
  it("sempre inclui o evento de adição à Biblioteca quando a data é válida", () => {
    const events = mergeTimelineEvents(makeInputs());
    expect(events).toEqual([
      { id: "book_added", type: "book_added", date: "2027-01-01T00:00:00.000Z", label: "Adicionado à Biblioteca" },
    ]);
  });

  it("ordena todos os eventos por data, mais recente primeiro", () => {
    const events = mergeTimelineEvents(
      makeInputs({
        bookCreatedAt: "2027-01-01T00:00:00.000Z",
        reading: { started_at: "2027-02-01T00:00:00.000Z", finished_at: "2027-03-01T00:00:00.000Z" },
      })
    );

    expect(events.map((event) => event.id)).toEqual(["reading_finished", "reading_started", "book_added"]);
  });

  it("gera um evento de início e, quando presente, um de fim para cada entrada de recomendação", () => {
    const events = mergeTimelineEvents(
      makeInputs({
        recommendationHistory: [
          {
            id: "rec-1",
            book_reading_id: "reading-1",
            book_id: "book-1",
            started_at: "2027-02-01T00:00:00.000Z",
            ended_at: "2027-03-01T00:00:00.000Z",
            created_at: "2027-02-01T00:00:00.000Z",
          },
          {
            id: "rec-2",
            book_reading_id: "reading-1",
            book_id: "book-1",
            started_at: "2027-04-01T00:00:00.000Z",
            ended_at: null,
            created_at: "2027-04-01T00:00:00.000Z",
          },
        ],
      })
    );

    const recommendationEvents = events.filter((event) => event.id !== "book_added");
    expect(recommendationEvents).toEqual([
      {
        id: "recommendation_started:rec-2",
        type: "recommendation_started",
        date: "2027-04-01T00:00:00.000Z",
        label: "Virou recomendação do mês",
        href: "/admin/recommendations",
      },
      {
        id: "recommendation_ended:rec-1",
        type: "recommendation_ended",
        date: "2027-03-01T00:00:00.000Z",
        label: "Deixou de ser recomendação do mês",
        href: "/admin/recommendations",
      },
      {
        id: "recommendation_started:rec-1",
        type: "recommendation_started",
        date: "2027-02-01T00:00:00.000Z",
        label: "Virou recomendação do mês",
        href: "/admin/recommendations",
      },
    ]);
  });

  it("rotula conteúdo publicado e rascunho de forma diferente", () => {
    const events = mergeTimelineEvents(
      makeInputs({
        contents: [
          {
            id: "content-1",
            book_id: "book-1",
            platform: "instagram",
            content_type: "reel",
            content_category: "book",
            url: "https://instagram.com/reel/1",
            is_featured: false,
            published_at: "2027-02-01T00:00:00.000Z",
            metadata: {},
            created_at: "2027-01-15T00:00:00.000Z",
            updated_at: "2027-01-15T00:00:00.000Z",
          },
          {
            id: "content-2",
            book_id: "book-1",
            platform: "youtube",
            content_type: "short",
            content_category: "book",
            url: "https://youtube.com/shorts/2",
            is_featured: false,
            metadata: {},
            created_at: "2027-01-20T00:00:00.000Z",
            updated_at: "2027-01-20T00:00:00.000Z",
          },
        ],
      })
    );

    const contentEvents = events.filter((event) => event.type === "content_published");
    expect(contentEvents).toEqual([
      {
        id: "content:content-1",
        type: "content_published",
        date: "2027-02-01T00:00:00.000Z",
        label: "Reel publicado no Instagram",
        href: "/admin/content/content-1/edit",
      },
      {
        id: "content:content-2",
        type: "content_published",
        date: "2027-01-20T00:00:00.000Z",
        label: "Short criado no YouTube (rascunho)",
        href: "/admin/content/content-2/edit",
      },
    ]);
  });

  it("gera um evento por campanha com a data de criação do item", () => {
    const events = mergeTimelineEvents(
      makeInputs({
        campaignEvents: [{ campaignId: "camp-1", campaignName: "Entrou na Mira", createdAt: "2027-02-10T00:00:00.000Z" }],
      })
    );

    expect(events.find((event) => event.type === "campaign_item_added")).toEqual({
      id: "campaign_item_added:camp-1:2027-02-10T00:00:00.000Z",
      type: "campaign_item_added",
      date: "2027-02-10T00:00:00.000Z",
      label: "Adicionado à campanha Entrou na Mira",
      href: "/admin/campaigns/camp-1",
    });
  });

  it("gera um evento por aparição no Clube, com rótulo mês/ano", () => {
    const events = mergeTimelineEvents(
      makeInputs({
        clubAppearances: [
          { yearId: "year-2027", monthId: "month-1", year: 2027, month: 1, createdAt: "2027-01-05T00:00:00.000Z" },
        ],
      })
    );

    expect(events.find((event) => event.type === "club_month_added")).toEqual({
      id: "club_month_added:month-1",
      type: "club_month_added",
      date: "2027-01-05T00:00:00.000Z",
      label: "Selecionado para o Clube — Janeiro/2027",
      href: "/admin/bookclub/year-2027/months/month-1",
    });
  });

  it("agrega avaliações num único evento com a contagem total e a data da mais recente", () => {
    const events = mergeTimelineEvents(
      makeInputs({
        ratingSummary: {
          average: 4.5,
          count: 12,
          ratings: [
            { rating: 5, comment: null, created_at: "2027-03-01T00:00:00.000Z", updated_at: "2027-03-01T00:00:00.000Z" },
            { rating: 4, comment: null, created_at: "2027-02-01T00:00:00.000Z", updated_at: "2027-02-01T00:00:00.000Z" },
          ],
        },
      })
    );

    expect(events.find((event) => event.type === "ratings_milestone")).toEqual({
      id: "ratings_milestone",
      type: "ratings_milestone",
      date: "2027-03-01T00:00:00.000Z",
      label: "12 avaliações da comunidade recebidas",
      href: "/admin/ratings",
    });
  });

  it("não gera evento de avaliações quando não há nenhuma", () => {
    const events = mergeTimelineEvents(makeInputs({ ratingSummary: { average: null, count: 0, ratings: [] } }));
    expect(events.some((event) => event.type === "ratings_milestone")).toBe(false);
  });
});
