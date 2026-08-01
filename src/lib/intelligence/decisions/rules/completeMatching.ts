import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";
import { UNMATCHED_CONTENT_RATIO_THRESHOLD } from "@/lib/intelligence/insights";

/**
 * "Finalize o Matching de conteúdos": lê exclusivamente o `QuestionAnswer`
 * de `unmatchedContentQuestion` (`questions/unmatchedContent.ts`). Reusa o
 * mesmo limiar já validado pela Insight `unmatched-content`
 * (`UNMATCHED_CONTENT_RATIO_THRESHOLD`, reexportado por
 * `lib/intelligence/insights`), pelo mesmo motivo do `import-stale-dataset`.
 */
export const completeMatchingDecision: DecisionRule = {
  id: "complete-matching",
  description: `Recomenda concluir o Matching quando pelo menos ${Math.round(UNMATCHED_CONTENT_RATIO_THRESHOLD * 100)}% dos Contents ainda não têm Livro vinculado.`,
  evaluate({ unmatchedContent }): Decision[] {
    if (!unmatchedContent.hasAnswer || !unmatchedContent.data) return [];
    if (unmatchedContent.data.unmatchedRatio < UNMATCHED_CONTENT_RATIO_THRESHOLD) return [];

    const { data } = unmatchedContent;
    const priority = data.unmatchedRatio >= 0.5 ? "high" : "medium";

    return [
      {
        id: "complete-matching",
        title: "Finalize o Matching de conteúdos",
        description: `${data.unmatchedContents} de ${data.totalContents} conteúdo(s) ainda não estão vinculados a um Livro, limitando análises por autor, gênero e país.`,
        priority,
        recommendedAction: "Abra Conteúdos (/admin/intelligence/conteudos) e confirme os matchings sugeridos ou vincule manualmente os pendentes.",
        rationale: `Baseado na pergunta "${unmatchedContent.question}": ${unmatchedContent.summary}`,
      },
    ];
  },
};
