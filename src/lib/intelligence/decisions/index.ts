export { DECISION_RULES, runDecisionEngine } from "@/lib/intelligence/decisions/engine";
export type { Decision, DecisionContext, DecisionPriority, DecisionRule } from "@/lib/intelligence/decisions/types";

export { repeatBestThemeDecision } from "@/lib/intelligence/decisions/rules/repeatBestTheme";
export { importStaleDatasetDecision } from "@/lib/intelligence/decisions/rules/importStaleDataset";
export { completeMatchingDecision } from "@/lib/intelligence/decisions/rules/completeMatching";
