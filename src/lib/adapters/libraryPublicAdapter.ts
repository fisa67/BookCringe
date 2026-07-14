import { mockRecentBooks } from "@/data/mock/stats";
import type { DetailedBook } from "@/lib/types";
import { getFinishedReadingsWithBooks } from "@/lib/services/bookReadingService";
import { mapToDetailedBooks } from "@/lib/adapters/readingStatsAggregators";

/**
 * Fase 6.1 da migração pública da Biblioteca (somente leitura).
 *
 * Este adapter lê do Supabase reutilizando `bookReadingService` (a mesma
 * query já usada por `readingStatsPublicAdapter`, sem os filtros `year`/
 * `limit`) e `mapToDetailedBooks` (Fase 1) para devolver o catálogo
 * completo de leituras finalizadas no formato `DetailedBook[]` — o mesmo
 * tipo de `mockRecentBooks` em `src/data/mock/stats.ts`, hoje consumido
 * por `src/app/biblioteca/page.tsx`. Isso permite que, quando a página
 * trocar o import estático por `getPublicLibraryBooks`, nenhum componente
 * visual precise mudar (`LibraryShelf` já é agnóstico à origem dos
 * dados). Este módulo ainda NÃO é importado por nenhuma página.
 *
 * Fallback: mesma estratégia de `readingStatsPublicAdapter` — se a busca
 * ao Supabase falhar, ou não houver nenhuma leitura finalizada, devolve
 * `mockRecentBooks` inteiro.
 */

/**
 * Retorna todos os livros lidos (`DetailedBook[]`), das leituras
 * finalizadas, sem filtro de ano ou quantidade — o catálogo completo da
 * Biblioteca. Ordenado por `finished_at` desc (herdado de
 * `getFinishedReadingsWithBooks`). Cai para `mockRecentBooks` em caso de
 * erro ou ausência de leituras finalizadas.
 */
export async function getPublicLibraryBooks(): Promise<DetailedBook[]> {
  try {
    const readings = await getFinishedReadingsWithBooks({});

    if (!readings || readings.length === 0) {
      return mockRecentBooks;
    }

    return mapToDetailedBooks(readings);
  } catch (error) {
    console.error(
      "[libraryPublicAdapter] Falha ao buscar catálogo do Supabase, usando fallback estático.",
      error
    );
    return mockRecentBooks;
  }
}
