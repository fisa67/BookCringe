import { getBookById } from "@/lib/services/bookService";
import { getReadingByBook } from "@/lib/services/bookReadingService";
import { getContentByBook } from "@/lib/services/contentService";
import { getPublicBookRatingSummary, type PublicBookRatingSummary } from "@/lib/services/bookRatingService";
import {
  getCampaignItemEventsForBook,
  type CampaignItemEvent,
} from "@/lib/services/promotionalCampaignService";
import { getBookClubAppearancesForBook, type BookClubAppearance } from "@/lib/services/clubService";
import { getRecommendationHistoryForBook } from "@/lib/services/monthlyRecommendationService";
import type { CmsBookReadingRecord, CmsContentRecord, CmsMonthlyRecommendationRecord } from "@/lib/types/cms";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/admin/contentLabels";
import { getMonthLabel } from "@/lib/admin/bookclubLabels";

export type BookTimelineEventType =
  | "book_added"
  | "reading_started"
  | "reading_finished"
  | "recommendation_started"
  | "recommendation_ended"
  | "content_published"
  | "campaign_item_added"
  | "club_month_added"
  | "ratings_milestone";

export interface BookTimelineEvent {
  /** Único dentro da timeline de um livro — usado como `key` na UI. */
  id: string;
  type: BookTimelineEventType;
  /** ISO 8601 — usado só para ordenar; a UI formata para pt-BR na exibição. */
  date: string;
  label: string;
  href?: string;
}

export interface BookTimelineInputs {
  bookCreatedAt: string;
  reading: Pick<CmsBookReadingRecord, "started_at" | "finished_at"> | null;
  recommendationHistory: CmsMonthlyRecommendationRecord[];
  contents: CmsContentRecord[];
  campaignEvents: CampaignItemEvent[];
  clubAppearances: BookClubAppearance[];
  ratingSummary: PublicBookRatingSummary | null;
}

function isValidDate(value: string | null | undefined): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

/**
 * Mescla eventos de todos os módulos numa única timeline, mais recente
 * primeiro — função pura (sem I/O), testável isoladamente. Cada evento vem
 * de uma data que já existe em algum módulo (`created_at`/`published_at`/
 * `started_at`/`finished_at`); nenhuma tabela nova de "eventos".
 *
 * Avaliações da comunidade são agregadas num único evento (contagem +
 * data da mais recente), não um por avaliação — evita poluir a timeline de
 * livros com muitas avaliações.
 */
export function mergeTimelineEvents(inputs: BookTimelineInputs): BookTimelineEvent[] {
  const events: BookTimelineEvent[] = [];

  if (isValidDate(inputs.bookCreatedAt)) {
    events.push({
      id: "book_added",
      type: "book_added",
      date: inputs.bookCreatedAt,
      label: "Adicionado à Biblioteca",
    });
  }

  if (isValidDate(inputs.reading?.started_at)) {
    events.push({
      id: "reading_started",
      type: "reading_started",
      date: inputs.reading!.started_at!,
      label: "Leitura iniciada",
    });
  }

  if (isValidDate(inputs.reading?.finished_at)) {
    events.push({
      id: "reading_finished",
      type: "reading_finished",
      date: inputs.reading!.finished_at!,
      label: "Leitura concluída",
    });
  }

  for (const entry of inputs.recommendationHistory) {
    if (isValidDate(entry.started_at)) {
      events.push({
        id: `recommendation_started:${entry.id}`,
        type: "recommendation_started",
        date: entry.started_at,
        label: "Virou recomendação do mês",
        href: "/admin/recommendations",
      });
    }
    if (isValidDate(entry.ended_at)) {
      events.push({
        id: `recommendation_ended:${entry.id}`,
        type: "recommendation_ended",
        date: entry.ended_at!,
        label: "Deixou de ser recomendação do mês",
        href: "/admin/recommendations",
      });
    }
  }

  for (const content of inputs.contents) {
    const date = content.published_at ?? content.created_at;
    if (!isValidDate(date)) continue;

    const typeLabel = CONTENT_TYPE_LABELS[content.content_type] ?? content.content_type;
    const platformLabel = PLATFORM_LABELS[content.platform] ?? content.platform;
    const label = content.published_at
      ? `${typeLabel} publicado no ${platformLabel}`
      : `${typeLabel} criado no ${platformLabel} (rascunho)`;

    events.push({
      id: `content:${content.id}`,
      type: "content_published",
      date,
      label,
      href: `/admin/content/${content.id}/edit`,
    });
  }

  for (const event of inputs.campaignEvents) {
    if (!isValidDate(event.createdAt)) continue;

    events.push({
      id: `campaign_item_added:${event.campaignId}:${event.createdAt}`,
      type: "campaign_item_added",
      date: event.createdAt,
      label: `Adicionado à campanha ${event.campaignName}`,
      href: `/admin/campaigns/${event.campaignId}`,
    });
  }

  for (const appearance of inputs.clubAppearances) {
    if (!isValidDate(appearance.createdAt)) continue;

    events.push({
      id: `club_month_added:${appearance.monthId}`,
      type: "club_month_added",
      date: appearance.createdAt,
      label: `Selecionado para o Clube — ${getMonthLabel(appearance.month)}/${appearance.year}`,
      href: `/admin/bookclub/${appearance.yearId}/months/${appearance.monthId}`,
    });
  }

  const latestRating = inputs.ratingSummary?.ratings[0];
  if (inputs.ratingSummary && inputs.ratingSummary.count > 0 && isValidDate(latestRating?.updated_at)) {
    events.push({
      id: "ratings_milestone",
      type: "ratings_milestone",
      date: latestRating!.updated_at,
      label: `${inputs.ratingSummary.count} avaliaç${inputs.ratingSummary.count === 1 ? "ão" : "ões"} da comunidade recebida${
        inputs.ratingSummary.count === 1 ? "" : "s"
      }`,
      href: "/admin/ratings",
    });
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Timeline de eventos de `bookId` para a aba "Timeline" de
 * `/admin/books/[id]/edit` — busca em paralelo tudo que `mergeTimelineEvents`
 * precisa, reaproveitando os mesmos services de `bookParticipationsAdapter`
 * (mais `getContentByBook`, `getBookById` e `getCampaignItemEventsForBook`,
 * que trazem os `created_at`/`published_at` que a Timeline exige e que o
 * resumo de Participações não precisa carregar).
 */
export async function getBookTimeline(bookId: string): Promise<BookTimelineEvent[]> {
  const [book, reading, recommendationHistory, contents, campaignEvents, clubAppearances, ratingSummary] =
    await Promise.all([
      getBookById(bookId),
      getReadingByBook(bookId),
      getRecommendationHistoryForBook(bookId),
      getContentByBook(bookId),
      getCampaignItemEventsForBook(bookId),
      getBookClubAppearancesForBook(bookId),
      getPublicBookRatingSummary(bookId),
    ]);

  if (!book) return [];

  return mergeTimelineEvents({
    bookCreatedAt: book.created_at,
    reading,
    recommendationHistory: recommendationHistory ?? [],
    contents: contents ?? [],
    campaignEvents: campaignEvents ?? [],
    clubAppearances: clubAppearances ?? [],
    ratingSummary,
  });
}
