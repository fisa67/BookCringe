import type { BookInsight, BookInsightRule } from "@/lib/books/insights/types";

/**
 * "No Clube sem nenhum conteúdo": o livro foi selecionado para um mês do
 * Clube de Leitura, mas ainda não tem nenhum conteúdo publicado — os
 * leitores do Clube não têm nada para assistir/ler sobre a escolha do mês.
 */
export const inClubWithoutContentRule: BookInsightRule = {
  id: "in-club-without-content",
  description: "Aponta livros do Clube de Leitura sem nenhum conteúdo publicado.",
  evaluate({ book, participations }): BookInsight[] {
    if (participations.clubAppearances.length === 0) return [];
    if (participations.contentCount > 0) return [];

    return [
      {
        id: `in-club-without-content:${book.id}`,
        ruleId: "in-club-without-content",
        severity: "warning",
        title: "No Clube sem nenhum conteúdo",
        message: "Este livro está em um mês do Clube de Leitura, mas ainda não tem nenhum conteúdo publicado.",
        actionLabel: "Criar conteúdo",
        actionHref: `/admin/content/new?bookId=${book.id}`,
      },
    ];
  },
};
