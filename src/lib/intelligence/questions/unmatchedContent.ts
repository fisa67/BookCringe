import type { IntelligenceContentRecord } from "@/lib/types/intelligence";
import type { Question } from "@/lib/intelligence/questions/types";

/**
 * Terceira pergunta do Épico Questions: "Quanto do meu conteúdo ainda não
 * foi vinculado a um Livro?" — introduzida na Sprint 11 para alimentar a
 * Decision Engine (`lib/intelligence/decisions/`,
 * `docs/intelligence/DECISIONS_ENGINE.md`).
 *
 * Só reporta o fato (contagem e proporção de Contents sem `book_id`); o
 * limiar que justifica uma recomendação (`UNMATCHED_CONTENT_RATIO_THRESHOLD`,
 * o mesmo já usado pelos Insights, reexportado por
 * `lib/intelligence/insights`) é aplicado por quem consome a resposta, não
 * aqui.
 */

export interface UnmatchedContentAnswerData {
  totalContents: number;
  unmatchedContents: number;
  /** 0 a 1. */
  unmatchedRatio: number;
}

export interface UnmatchedContentQuestionContext {
  now: Date;
  contents: IntelligenceContentRecord[];
}

function formatSummary(data: UnmatchedContentAnswerData | null): string {
  if (!data) {
    return "Ainda não há nenhum conteúdo importado para avaliar o Matching.";
  }

  const percentage = Math.round(data.unmatchedRatio * 100);
  return `${data.unmatchedContents} de ${data.totalContents} conteúdo(s) (${percentage}%) ainda não foram vinculados a um Livro.`;
}

export const unmatchedContentQuestion: Question<UnmatchedContentQuestionContext, UnmatchedContentAnswerData> = {
  id: "unmatched-content",
  question: "Quanto do meu conteúdo ainda não foi vinculado a um Livro?",
  answer(context) {
    const totalContents = context.contents.length;
    const unmatchedContents = context.contents.filter((content) => !content.book_id).length;

    const data: UnmatchedContentAnswerData | null =
      totalContents === 0 ? null : { totalContents, unmatchedContents, unmatchedRatio: unmatchedContents / totalContents };

    return {
      questionId: "unmatched-content",
      question: "Quanto do meu conteúdo ainda não foi vinculado a um Livro?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: formatSummary(data),
    };
  },
};
