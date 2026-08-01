import { titleSimilarity } from "@/lib/intelligence/matching/similarity";

/**
 * A partir de qual score um Livro vira "sugestão" na UI. Calibrado para
 * pegar variações comuns entre título de vídeo e título de Livro (ex.:
 * "Como ler mais em 2026 | Resenha" vs. "Como ler mais em 2026") sem sugerir
 * livros só vagamente parecidos. Ajustável conforme o uso real mostrar
 * falsos positivos/negativos — é uma constante, não um valor mágico espalhado.
 */
export const MATCH_SUGGESTION_THRESHOLD = 0.6;

export interface MatchableBook {
  id: string;
  title: string;
}

export interface BookMatchCandidate {
  bookId: string;
  bookTitle: string;
  /** 0 a 1 — ver `titleSimilarity`. */
  score: number;
}

/**
 * Matching assistido, não automático: só *sugere* candidatos por
 * similaridade de título — quem decide se algum deles é o Livro certo
 * (ou se não é nenhum) é sempre uma pessoa, confirmando manualmente na UI.
 * Sem IA, sem busca semântica — puro texto (`titleSimilarity`).
 */
export function findBookMatchCandidates(params: {
  contentTitle: string;
  books: readonly MatchableBook[];
  limit?: number;
}): BookMatchCandidate[] {
  const candidates = params.books
    .map((book) => ({
      bookId: book.id,
      bookTitle: book.title,
      score: titleSimilarity(params.contentTitle, book.title),
    }))
    .filter((candidate) => candidate.score >= MATCH_SUGGESTION_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return params.limit ? candidates.slice(0, params.limit) : candidates;
}

/** Atalho para o caso mais comum na UI: só a melhor sugestão (ou nenhuma). */
export function suggestBookMatch(params: {
  contentTitle: string;
  books: readonly MatchableBook[];
}): BookMatchCandidate | null {
  const [best] = findBookMatchCandidates({ ...params, limit: 1 });
  return best ?? null;
}
