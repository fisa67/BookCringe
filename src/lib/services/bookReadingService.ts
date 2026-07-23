import type { CmsBookReadingRecord, CmsFinishedReadingWithBook } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "book_readings";

export interface GetFinishedReadingsFilters {
  /** Filtra leituras finalizadas dentro do ano (por finished_at). */
  year?: number;
  /** Limita a quantidade de resultados (mais recentes primeiro). */
  limit?: number;
}

export async function getReadingsCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[bookReadingService] getReadingsCount error", error);
    return null;
  }

  return count;
}

/**
 * Leituras finalizadas (`status = 'finished'`) com o livro relacionado
 * embutido, ordenadas por `finished_at` desc — base para os agregadores
 * públicos de estatísticas (`readingStatsAggregators`, `readingStatsPublicAdapter`).
 */
export async function getFinishedReadingsWithBooks(
  filters: GetFinishedReadingsFilters = {}
): Promise<CmsFinishedReadingWithBook[] | null> {
  let query = supabaseAdminClient
    .from(TABLE)
    .select("*, books(*)")
    .eq("status", "finished")
    .order("finished_at", { ascending: false });

  if (filters.year) {
    query = query
      .gte("finished_at", `${filters.year}-01-01`)
      .lte("finished_at", `${filters.year}-12-31`);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[bookReadingService] getFinishedReadingsWithBooks error", error);
    return null;
  }

  // O tipo `Database` (src/lib/types/database.ts) declara `Relationships: []`
  // para todas as tabelas, então o Supabase-JS não infere estaticamente o
  // embed `books(*)` — a query em si é válida (a FK existe no Postgres).
  return data as unknown as CmsFinishedReadingWithBook[];
}

/**
 * Leitura atualmente marcada como "Recomendação do mês" (no máximo 1 no
 * site inteiro — ver índice único parcial na migration
 * `20260723_book_readings_editorial.sql`), com o livro embutido. `null`
 * quando nenhuma está marcada — a UI (`/recomendacoes`) simplesmente não
 * mostra o destaque nesse caso.
 */
export async function getRecommendationOfMonth(): Promise<CmsFinishedReadingWithBook | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*, books(*)")
    .eq("is_recommendation_of_month", true)
    .maybeSingle();

  if (error) {
    console.error("[bookReadingService] getRecommendationOfMonth error", error);
    return null;
  }

  return data as unknown as CmsFinishedReadingWithBook | null;
}

/**
 * Desmarca "Recomendação do mês" de qualquer leitura que não seja `bookId`.
 * Chamada ANTES de salvar a leitura que está sendo promovida — nessa ordem,
 * quando o upsert seguinte marcar `is_recommendation_of_month = true`, no
 * máximo 1 linha estará com `true` no momento do commit, nunca colidindo
 * com o índice único parcial (a constraint é verificada ao final de cada
 * statement, não é postergável).
 */
export async function clearRecommendationOfMonthExcept(bookId: string): Promise<void> {
  const { error } = await supabaseAdminClient
    .from(TABLE)
    .update({ is_recommendation_of_month: false })
    .eq("is_recommendation_of_month", true)
    .neq("book_id", bookId);

  if (error) {
    console.error("[bookReadingService] clearRecommendationOfMonthExcept error", error);
  }
}

export async function getReadingByBook(bookId: string): Promise<CmsBookReadingRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    console.error("[bookReadingService] getReadingByBook error", error);
    return null;
  }

  return data;
}

export async function createReading(
  payload: Omit<CmsBookReadingRecord, "id" | "created_at" | "updated_at">
): Promise<CmsBookReadingRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[bookReadingService] createReading error", error);
    return null;
  }

  return data;
}

export async function updateReading(
  payload: Partial<CmsBookReadingRecord> & { id: string }
): Promise<CmsBookReadingRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update(payload)
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[bookReadingService] updateReading error", error);
    return null;
  }

  return data;
}

export async function saveReading(
  payload: Omit<CmsBookReadingRecord, "id" | "created_at" | "updated_at">
): Promise<CmsBookReadingRecord | null> {
  const existingReading = await getReadingByBook(payload.book_id);

  if (existingReading) {
    return updateReading({
      ...existingReading,
      ...payload,
    });
  }

  return createReading(payload);
}
