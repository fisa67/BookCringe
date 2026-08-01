import type { Insight, Rule } from "@/lib/intelligence/insights/types";

/** Fração (0 a 1) de Contents sem Livro vinculado a partir da qual o Dashboard avisa. */
export const UNMATCHED_CONTENT_RATIO_THRESHOLD = 0.3;

/**
 * "Conteúdos sem Livro": lê o mesmo `book_id` do Matching assistido
 * (`docs/content-matching.md`) — quanto mais Contents vinculados, mais
 * análises por autor/gênero/país o Dashboard consegue mostrar no futuro.
 */
export const unmatchedContentRule: Rule = {
  id: "unmatched-content",
  description: `Aponta quando pelo menos ${Math.round(UNMATCHED_CONTENT_RATIO_THRESHOLD * 100)}% dos Contents ainda não têm Livro vinculado.`,
  evaluate({ contents }): Insight[] {
    if (contents.length === 0) return [];

    const unmatchedCount = contents.filter((content) => !content.book_id).length;
    const unmatchedRatio = unmatchedCount / contents.length;
    if (unmatchedRatio < UNMATCHED_CONTENT_RATIO_THRESHOLD) return [];

    return [
      {
        id: "unmatched-content",
        ruleId: "unmatched-content",
        severity: "info",
        title: "Conteúdos sem Livro",
        message: `${unmatchedCount} de ${contents.length} conteúdo(s) ainda não foram vinculados a um Livro. Confirme os matchings sugeridos em Conteúdos.`,
      },
    ];
  },
};
