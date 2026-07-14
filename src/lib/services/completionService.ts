import type { CmsBookReadingRecord, CmsBookRecord, CmsStatisticsRecord } from "@/lib/types/cms";
import { getBookById } from "@/lib/services/bookService";
import { getSettings } from "@/lib/services/settingsService";
import { getReadingByBook, saveReading } from "@/lib/services/bookReadingService";
import { getStatisticsByYear, createOrUpdateStatistics } from "@/lib/services/statsService";
import { buildAmazonAffiliateUrl } from "@/lib/services/affiliateService";
import { parseHhMmSsToSeconds } from "@/lib/utils/time";

export interface FinalizeReadingParams {
  bookId: string;
  finishedAt?: string;
  rating?: number;
  review?: string;
  favorite?: boolean;
  wouldRecommend?: boolean;
  year?: number;
  /**
   * Tempo total de leitura informado manualmente (vindo do Bookly), no
   * formato `HH:MM:SS`. Convertido para segundos antes de persistir em
   * `reading_time_seconds`. Se ausente ou em formato inválido, o valor já
   * salvo na leitura existente é preservado (nunca é apagado por omissão).
   */
  readingTime?: string;
}

export interface FinalizeReadingResult {
  reading: CmsBookReadingRecord | null;
  statistics: CmsStatisticsRecord | null;
  affiliateUrl?: string;
}

export async function finalizeBookReading(
  params: FinalizeReadingParams
): Promise<FinalizeReadingResult> {
  const book: CmsBookRecord | null = await getBookById(params.bookId);

  if (!book) {
    console.error("[completionService] Book not found", params.bookId);
    return { reading: null, statistics: null };
  }

  const existingReading = await getReadingByBook(params.bookId);
  const finishedAt = params.finishedAt ?? new Date().toISOString().slice(0, 10);
  const targetYear = params.year ?? new Date(finishedAt).getUTCFullYear();

  // `parseHhMmSsToSeconds` devolve `null` para ausente/inválido — nesse caso
  // caímos para o valor já persistido (nunca zeramos o tempo de leitura só
  // porque uma chamada de finalize não o informou). Convertido para
  // `string` para casar com `CmsBookReadingRecord.reading_time_seconds`
  // (bigint serializado como string pelo Supabase-JS) — o Postgres aceita
  // string numérica na escrita de uma coluna bigint sem problema.
  const parsedReadingTimeSeconds = parseHhMmSsToSeconds(params.readingTime);
  const readingTimeSeconds =
    parsedReadingTimeSeconds !== null
      ? String(parsedReadingTimeSeconds)
      : existingReading?.reading_time_seconds ?? undefined;

  const readingPayload = {
    book_id: params.bookId,
    rating: params.rating,
    review: params.review,
    started_at: existingReading?.started_at,
    finished_at: finishedAt,
    status: "finished",
    format: book.format,
    favorite: params.favorite ?? false,
    would_recommend: params.wouldRecommend ?? false,
    reading_time_seconds: readingTimeSeconds,
    metadata: existingReading?.metadata ?? {},
  };

  const reading = await saveReading(readingPayload);
  const settings = await getSettings();

  let statistics: CmsStatisticsRecord | null = null;
  if (existingReading?.status !== "finished") {
    const currentStats = await getStatisticsByYear(targetYear);
    const updatedStats = {
      year: targetYear,
      annual_goal: currentStats?.annual_goal ?? 52,
      books_read: (currentStats?.books_read ?? 0) + 1,
      pages_read: (currentStats?.pages_read ?? 0) + (book.page_count ?? 0),
      hours_read: currentStats?.hours_read ?? 0,
      authors_read: currentStats?.authors_read ?? 0,
      genres_read: currentStats?.genres_read ?? 0,
      countries_read: currentStats?.countries_read ?? 0,
      metadata: currentStats?.metadata ?? {},
    };

    statistics = await createOrUpdateStatistics(updatedStats);
  } else {
    statistics = await getStatisticsByYear(targetYear);
  }

  const affiliateUrl = buildAmazonAffiliateUrl(book.amazon_url, settings?.amazon_associate_id);

  return {
    reading,
    statistics,
    affiliateUrl,
  };
}
