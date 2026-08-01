import type { BookInsight, BookInsightRule } from "@/lib/books/insights/types";

/**
 * "Favorito, mas nunca recomendado do mês": um livro favorito/recomendado
 * que nunca ocupou o destaque de "Recomendação do mês". Sem `actionHref` —
 * a ação real (marcar como recomendação) já está um card acima, em Ações
 * Rápidas (`QuickActionsCard`, na mesma página), então este insight é só
 * um lembrete, sem duplicar o botão.
 */
export const favoriteNeverRecommendedRule: BookInsightRule = {
  id: "favorite-never-recommended",
  description: "Aponta favoritos/recomendados que nunca foram a recomendação do mês.",
  evaluate({ book, reading, participations }): BookInsight[] {
    if (!reading?.favorite && !reading?.would_recommend) return [];
    if (participations.recommendationHistory.length > 0) return [];

    return [
      {
        id: `favorite-never-recommended:${book.id}`,
        ruleId: "favorite-never-recommended",
        severity: "info",
        title: "Nunca foi recomendação do mês",
        message: "Este livro é um favorito da Curadoria, mas ainda não teve seu momento como Recomendação do mês — use as Ações Rápidas acima para marcá-lo.",
      },
    ];
  },
};
