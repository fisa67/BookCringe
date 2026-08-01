import type { Decision } from "@/lib/intelligence/decisions";
import type { ActionBuilder, WorkspaceAction } from "@/lib/intelligence/actions/types";
import { repeatBestThemeActionBuilder } from "@/lib/intelligence/actions/builders/repeatBestTheme";
import { updateDatasetActionBuilder } from "@/lib/intelligence/actions/builders/updateDataset";
import { completeMatchingActionBuilder } from "@/lib/intelligence/actions/builders/completeMatching";

/**
 * Mesmo formato de `DECISION_RULES` (Decision Engine) e `INTELLIGENCE_RULES`
 * (Insights): uma lista de builders independentes. Adicionar uma
 * WorkspaceAction nova para uma Decision futura nunca exige mudar os
 * demais builders — só implementar `ActionBuilder` e listar aqui.
 */
export const ACTION_BUILDERS: ActionBuilder[] = [
  repeatBestThemeActionBuilder,
  updateDatasetActionBuilder,
  completeMatchingActionBuilder,
];

const PRIORITY_RANK: Record<WorkspaceAction["priority"], number> = { high: 0, medium: 1, low: 2 };

/**
 * Transforma `Decision[]` (Sprint 11) em `WorkspaceAction[]` — o único
 * ponto que conhece todos os builders. Puramente síncrono: nenhum I/O
 * acontece aqui, só composição. Ordenado por prioridade, mesmo critério já
 * usado por `runDecisionEngine`.
 */
export function buildWorkspaceActions(decisions: Decision[]): WorkspaceAction[] {
  return ACTION_BUILDERS.flatMap((builder) => builder.build(decisions)).sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  );
}
