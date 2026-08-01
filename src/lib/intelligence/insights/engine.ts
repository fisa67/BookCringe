import type { Insight, Rule, RuleContext } from "@/lib/intelligence/insights/types";
import { staleDatasetRule } from "@/lib/intelligence/insights/rules/staleDataset";
import { lowContentVolumeRule } from "@/lib/intelligence/insights/rules/lowContentVolume";
import { noRecentImportRule } from "@/lib/intelligence/insights/rules/noRecentImport";
import { unmatchedContentRule } from "@/lib/intelligence/insights/rules/unmatchedContent";
import { platformWithoutDatasetRule } from "@/lib/intelligence/insights/rules/platformWithoutDataset";

/**
 * O Rules Engine em si: uma lista de regras independentes. Adicionar uma
 * regra nova nunca exige mudar as demais nem o motor — só implementar
 * `Rule` (`insights/types.ts`) em `insights/rules/` e listar aqui.
 */
export const INTELLIGENCE_RULES: Rule[] = [
  staleDatasetRule,
  lowContentVolumeRule,
  noRecentImportRule,
  unmatchedContentRule,
  platformWithoutDatasetRule,
];

export function runIntelligenceRules(context: RuleContext): Insight[] {
  return INTELLIGENCE_RULES.flatMap((rule) => rule.evaluate(context));
}
