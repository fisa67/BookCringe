import type { CmsBookReadingRecord, CmsBookRecord, CmsStatisticsRecord } from "@/lib/types/cms";
import { getBookById } from "@/lib/services/bookService";
import { getSettings } from "@/lib/services/settingsService";
import { getReadingByBook, saveReading } from "@/lib/services/bookReadingService";
import { getStatisticsByYear } from "@/lib/services/statsService";
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
    // Camada editorial (Curadoria BookCringe) — fora do escopo deste
    // endpoint (finalização automática via Bookly), sempre preservada da
    // leitura existente para nunca ser apagada por uma chamada que não sabe
    // desses campos.
    recommendation_reason: existingReading?.recommendation_reason,
    is_recommendation_of_month: existingReading?.is_recommendation_of_month ?? false,
    reading_time_seconds: readingTimeSeconds,
    metadata: existingReading?.metadata ?? {},
  };

  const reading = await saveReading(readingPayload);
  const settings = await getSettings();

  // `statistics` não é mais incrementado aqui: `books_read`/`pages_read`
  // (e demais contadores legados) deixaram de ser mantidos pelo app —
  // `/estatisticas` calcula tudo ao vivo a partir de `book_readings`
  // (`readingStatsPublicAdapter`), única fonte de verdade. A única coisa
  // que resta em `statistics` é a meta anual (`annual_goal`, gerenciada em
  // `/admin/stats`) — só lida aqui, nunca escrita, para devolver no
  // response caso o chamador (Bookly) queira exibi-la.
  const statistics: CmsStatisticsRecord | null = await getStatisticsByYear(targetYear);

  const affiliateUrl = buildAmazonAffiliateUrl(book.amazon_url, settings?.amazon_associate_id);

  return {
    reading,
    statistics,
    affiliateUrl,
  };
}
