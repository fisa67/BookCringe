import type { Decision, DecisionContext, DecisionRule } from "@/lib/intelligence/decisions/types";
import { repeatBestThemeDecision } from "@/lib/intelligence/decisions/rules/repeatBestTheme";
import { importStaleDatasetDecision } from "@/lib/intelligence/decisions/rules/importStaleDataset";
import { completeMatchingDecision } from "@/lib/intelligence/decisions/rules/completeMatching";

/**
 * A Decision Engine em si: uma lista de regras independentes, mesmo
 * formato do `INTELLIGENCE_RULES` dos Insights. Adicionar uma decisão nova
 * nunca exige mudar as demais nem o motor — só implementar `DecisionRule`
 * (`decisions/types.ts`) em `decisions/rules/` e listar aqui.
 */
export const DECISION_RULES: DecisionRule[] = [
  repeatBestThemeDecision,
  importStaleDatasetDecision,
  completeMatchingDecision,
];

const PRIORITY_RANK: Record<Decision["priority"], number> = { high: 0, medium: 1, low: 2 };

export function runDecisionEngine(context: DecisionContext): Decision[] {
  return DECISION_RULES.flatMap((rule) => rule.evaluate(context)).sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  );
}
