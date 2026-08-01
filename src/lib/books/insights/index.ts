export { BOOK_INSIGHT_RULES, runBookInsightRules } from "@/lib/books/insights/engine";
export type { BookInsight, BookInsightContext, BookInsightRule, BookInsightSeverity } from "@/lib/books/insights/types";

export { HIGH_RATING_THRESHOLD, noVideoContentRule } from "@/lib/books/insights/rules/noVideoContent";
export { notInAnyCampaignRule } from "@/lib/books/insights/rules/notInAnyCampaign";
export {
  DAYS_WITHOUT_RATING_THRESHOLD,
  neverRatedAfterFinishedRule,
} from "@/lib/books/insights/rules/neverRatedAfterFinished";
export { favoriteNeverRecommendedRule } from "@/lib/books/insights/rules/favoriteNeverRecommended";
export { inClubWithoutContentRule } from "@/lib/books/insights/rules/inClubWithoutContent";
