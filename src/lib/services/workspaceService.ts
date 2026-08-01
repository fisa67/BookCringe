import { getRecommendedDecisions } from "@/lib/services/intelligenceDecisionsService";
import { buildWorkspaceActions } from "@/lib/intelligence/actions";
import type { WorkspaceAction } from "@/lib/intelligence/actions";

/**
 * Ponto de entrada de I/O do Workspace (Sprint 12,
 * `docs/intelligence/WORKSPACE.md`): busca as Decisions já calculadas via
 * `getRecommendedDecisions` (Sprint 11, sem refazer nenhuma consulta) e
 * delega a transformação para `buildWorkspaceActions`, que só enxerga
 * `Decision[]` — nunca um Dataset/Import/Content/Metric bruto.
 */
export async function getWorkspaceActions(): Promise<WorkspaceAction[]> {
  const decisions = await getRecommendedDecisions();
  return buildWorkspaceActions(decisions);
}
