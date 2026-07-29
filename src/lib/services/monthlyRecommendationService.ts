import type { CmsMonthlyRecommendationRecord, CmsMonthlyRecommendationWithBook } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "monthly_recommendations";

/**
 * Histórico editorial permanente da "Recomendação do mês" — log de quando
 * cada livro entrou/saiu do destaque (ver migration
 * `20260729_monthly_recommendations.sql`). Só quem grava aqui é
 * `syncRecommendationHistory`, chamada por `saveReadingAction`
 * (`src/app/admin/books/actions.ts`) depois que
 * `book_readings.is_recommendation_of_month` é salvo — nada aqui altera o
 * destaque atual em si, que continua sendo `is_recommendation_of_month`
 * (fonte de verdade das páginas públicas).
 */

/**
 * Histórico completo, mais recente primeiro — base de `/admin/recommendations`.
 */
export async function getRecommendationHistory(): Promise<CmsMonthlyRecommendationWithBook[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*, books(*)")
    .order("started_at", { ascending: false });

  if (error) {
    console.error("[monthlyRecommendationService] getRecommendationHistory error", error);
    return null;
  }

  // Mesma ressalva de `getFinishedReadingsWithBooks`: o tipo `Database` não
  // declara as FKs, então o Supabase-JS não infere o embed `books(*)`
  // estaticamente, mas a query é válida (FK existe no Postgres).
  return data as unknown as CmsMonthlyRecommendationWithBook[];
}

/**
 * Encerra a recomendação ativa (`ended_at = now()`), se houver — no-op
 * silencioso quando não há nenhuma. Sempre roda ANTES de abrir a próxima
 * (`startRecommendation`), nessa ordem, para nunca colidir com o índice
 * único parcial `monthly_recommendations_one_active`.
 */
async function closeActiveRecommendation(): Promise<void> {
  const { error } = await supabaseAdminClient
    .from(TABLE)
    .update({ ended_at: new Date().toISOString() })
    .is("ended_at", null);

  if (error) {
    console.error("[monthlyRecommendationService] closeActiveRecommendation error", error);
  }
}

async function startRecommendation(params: { bookReadingId: string; bookId: string }): Promise<void> {
  const { error } = await supabaseAdminClient.from(TABLE).insert({
    book_reading_id: params.bookReadingId,
    book_id: params.bookId,
    started_at: new Date().toISOString(),
    ended_at: null,
  });

  if (error) {
    console.error("[monthlyRecommendationService] startRecommendation error", error);
  }
}

export interface SyncRecommendationHistoryParams {
  bookReadingId: string;
  bookId: string;
  /** `book_readings.is_recommendation_of_month` antes deste salvamento. */
  wasActive: boolean;
  /** `book_readings.is_recommendation_of_month` depois deste salvamento. */
  isActive: boolean;
}

export type RecommendationHistorySyncAction = "none" | "close" | "close-and-start";

/**
 * Decide o que fazer em `monthly_recommendations` para uma transição de
 * `is_recommendation_of_month` — extraída como função pura (sem tocar o
 * Supabase) para ser testável sozinha, mesmo padrão de
 * `shouldSendWelcomeEmail`:
 *   - inativo → ativo: `"close-and-start"` — encerra a recomendação ativa
 *     anterior (deste livro ou de outro — só pode haver 1) e abre uma nova.
 *   - ativo → inativo: `"close"` — o admin desmarcou o destaque sem outro
 *     livro assumir o posto; só encerra, sem abrir uma nova.
 *   - sem mudança (ativo→ativo ou inativo→inativo): `"none"` — evita
 *     reabrir/fechar histórico à toa a cada edição de nota, resenha etc. no
 *     mesmo livro que já é (ou já não é) a recomendação atual.
 */
export function getRecommendationHistorySyncAction(
  wasActive: boolean,
  isActive: boolean
): RecommendationHistorySyncAction {
  if (wasActive === isActive) return "none";
  return isActive ? "close-and-start" : "close";
}

/**
 * Mantém `monthly_recommendations` em sincronia com as transições de
 * `is_recommendation_of_month` — chamada por `saveReadingAction` depois do
 * upsert em `book_readings` (só nesse momento existe o `book_reading_id`
 * definitivo, no caso de a leitura estar sendo criada agora).
 */
export async function syncRecommendationHistory({
  bookReadingId,
  bookId,
  wasActive,
  isActive,
}: SyncRecommendationHistoryParams): Promise<void> {
  const action = getRecommendationHistorySyncAction(wasActive, isActive);

  if (action === "none") return;

  await closeActiveRecommendation();

  if (action === "close-and-start") {
    await startRecommendation({ bookReadingId, bookId });
  }
}

/** Recomendação ativa no momento (`ended_at is null`) — `null` se nenhuma. */
export async function getActiveRecommendationHistoryEntry(): Promise<CmsMonthlyRecommendationRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .is("ended_at", null)
    .maybeSingle();

  if (error) {
    console.error("[monthlyRecommendationService] getActiveRecommendationHistoryEntry error", error);
    return null;
  }

  return data;
}
