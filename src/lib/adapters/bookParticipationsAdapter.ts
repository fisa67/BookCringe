import { getContents } from "@/lib/services/contentService";
import { getPublicBookRatingSummary } from "@/lib/services/bookRatingService";
import { getCampaignsContainingBook, type CampaignSummary } from "@/lib/services/promotionalCampaignService";
import {
  getBookClubAppearancesForBook,
  type BookClubAppearance,
} from "@/lib/services/clubService";
import {
  getRecommendationHistoryForBook,
} from "@/lib/services/monthlyRecommendationService";
import type { CmsMonthlyRecommendationRecord } from "@/lib/types/cms";
import { isVideoContentType } from "@/lib/content";

export interface BookParticipationsSummary {
  contentCount: number;
  hasVideoContent: boolean;
  campaigns: CampaignSummary[];
  ratingsCount: number;
  ratingsAverage: number | null;
  clubAppearances: BookClubAppearance[];
  recommendationHistory: CmsMonthlyRecommendationRecord[];
  isCurrentRecommendation: boolean;
}

/**
 * Agrega, para a seção "Participações" de `/admin/books/[id]/edit`, tudo
 * que já existe sobre o livro nos outros módulos do CMS — nenhuma tabela
 * nova, nenhuma escrita, só leitura reaproveitando os services já
 * existentes (`contentService`, `bookRatingService`,
 * `promotionalCampaignService`, `clubService`,
 * `monthlyRecommendationService`). Os badges (possui conteúdo, em
 * campanha, favorito, recomendado) nunca são persistidos — são sempre
 * calculados a partir deste resumo + `book_readings`.
 */
export async function getBookParticipations(bookId: string): Promise<BookParticipationsSummary> {
  const [contents, ratingSummary, campaigns, clubAppearances, recommendationHistory] = await Promise.all([
    getContents({ bookId }),
    getPublicBookRatingSummary(bookId),
    getCampaignsContainingBook(bookId),
    getBookClubAppearancesForBook(bookId),
    getRecommendationHistoryForBook(bookId),
  ]);

  const contentList = contents ?? [];
  const recommendationList = recommendationHistory ?? [];

  return {
    contentCount: contentList.length,
    hasVideoContent: contentList.some((content) => isVideoContentType(content.content_type)),
    campaigns: campaigns ?? [],
    ratingsCount: ratingSummary?.count ?? 0,
    ratingsAverage: ratingSummary?.average ?? null,
    clubAppearances: clubAppearances ?? [],
    recommendationHistory: recommendationList,
    isCurrentRecommendation: recommendationList.some((entry) => entry.ended_at === null),
  };
}

export interface ParticipationItem {
  /** Estável entre renders (chave React) — não persistido em lugar nenhum. */
  key: string;
  label: string;
  href?: string;
}

/**
 * Achata o resumo de participações num checklist genérico — um item por
 * participação real, no formato do print de referência ("✔ Recomendações",
 * "✔ Campanha X", "✔ Clube Literário 2027", "✔ N conteúdos publicados",
 * "✔ N avaliações"). Função pura (sem I/O) para ser testável isoladamente e
 * para permitir, no futuro, plugar novas entidades (Autor, Coleção) sem
 * mexer na UI — basta adicionar mais itens aqui.
 *
 * Aparições no Clube são agrupadas por ano (um item por ano, não por mês) —
 * o mesmo livro pode aparecer em vários meses do mesmo ano, mas o checklist
 * mostra "Clube Literário 2027" uma única vez.
 */
export function buildParticipationChecklist(
  bookId: string,
  summary: BookParticipationsSummary
): ParticipationItem[] {
  const items: ParticipationItem[] = [];

  if (summary.recommendationHistory.length > 0) {
    items.push({
      key: "recommendations",
      label: summary.isCurrentRecommendation ? "Recomendação do mês (atual)" : "Já foi recomendação do mês",
      href: "/admin/recommendations",
    });
  }

  for (const campaign of summary.campaigns) {
    items.push({
      key: `campaign:${campaign.id}`,
      label: `Campanha ${campaign.name}`,
      href: `/admin/campaigns/${campaign.id}`,
    });
  }

  const clubYears = new Map<string, { yearId: string; year: number; yearTitle?: string }>();
  for (const appearance of summary.clubAppearances) {
    clubYears.set(appearance.yearId, appearance);
  }
  for (const { yearId, year, yearTitle } of clubYears.values()) {
    items.push({
      key: `club:${yearId}`,
      label: yearTitle ?? `Clube Literário ${year}`,
      href: `/admin/bookclub/${yearId}`,
    });
  }

  if (summary.contentCount > 0) {
    items.push({
      key: "contents",
      label: `${summary.contentCount} conteúdo${summary.contentCount === 1 ? "" : "s"} publicado${summary.contentCount === 1 ? "" : "s"}`,
      href: `/admin/content?bookId=${bookId}`,
    });
  }

  if (summary.ratingsCount > 0) {
    items.push({
      key: "ratings",
      label: `${summary.ratingsCount} avaliaç${summary.ratingsCount === 1 ? "ão" : "ões"}${
        summary.ratingsAverage !== null ? ` (${summary.ratingsAverage.toFixed(1)}★)` : ""
      }`,
      href: "/admin/ratings",
    });
  }

  return items;
}
