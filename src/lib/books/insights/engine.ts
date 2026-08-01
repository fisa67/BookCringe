import type { BookInsight, BookInsightContext, BookInsightRule } from "@/lib/books/insights/types";
import { noVideoContentRule } from "@/lib/books/insights/rules/noVideoContent";
import { notInAnyCampaignRule } from "@/lib/books/insights/rules/notInAnyCampaign";
import { neverRatedAfterFinishedRule } from "@/lib/books/insights/rules/neverRatedAfterFinished";
import { favoriteNeverRecommendedRule } from "@/lib/books/insights/rules/favoriteNeverRecommended";
import { inClubWithoutContentRule } from "@/lib/books/insights/rules/inClubWithoutContent";

/**
 * O Rules Engine em si: uma lista de regras independentes. Adicionar uma
 * regra nova nunca exige mudar as demais nem o motor — só implementar
 * `BookInsightRule` (`types.ts`) em `rules/` e listar aqui.
 */
export const BOOK_INSIGHT_RULES: BookInsightRule[] = [
  noVideoContentRule,
  notInAnyCampaignRule,
  neverRatedAfterFinishedRule,
  favoriteNeverRecommendedRule,
  inClubWithoutContentRule,
];

export function runBookInsightRules(context: BookInsightContext): BookInsight[] {
  return BOOK_INSIGHT_RULES.flatMap((rule) => rule.evaluate(context));
}
