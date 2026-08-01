import type { BookInsight, BookInsightRule } from "@/lib/books/insights/types";

/** Dias após a conclusão da leitura a partir dos quais a ausência de avaliações vira um insight. */
export const DAYS_WITHOUT_RATING_THRESHOLD = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * "Nunca avaliado pela comunidade": a leitura foi concluída há tempo
 * suficiente para a comunidade ter tido chance de avaliar, mas o livro
 * segue com zero avaliações — sinal de que falta divulgação, não de que o
 * livro é ruim.
 */
export const neverRatedAfterFinishedRule: BookInsightRule = {
  id: "never-rated-after-finished",
  description: "Aponta leituras concluídas há mais de 30 dias sem nenhuma avaliação da comunidade.",
  evaluate({ book, reading, participations, now }): BookInsight[] {
    if (participations.ratingsCount > 0) return [];
    if (reading?.status !== "finished" || !reading.finished_at) return [];

    const finishedAt = new Date(reading.finished_at);
    if (Number.isNaN(finishedAt.getTime())) return [];

    const daysSinceFinished = (now.getTime() - finishedAt.getTime()) / MS_PER_DAY;
    if (daysSinceFinished < DAYS_WITHOUT_RATING_THRESHOLD) return [];

    return [
      {
        id: `never-rated-after-finished:${book.id}`,
        ruleId: "never-rated-after-finished",
        severity: "warning",
        title: "Nunca avaliado pela comunidade",
        message: `A leitura foi concluída há mais de ${DAYS_WITHOUT_RATING_THRESHOLD} dias e o livro ainda não recebeu nenhuma avaliação — vale divulgar a página pública para pedir avaliações.`,
        actionLabel: "Ver página pública",
        actionHref: `/livro/${book.slug}`,
        actionExternal: true,
      },
    ];
  },
};
