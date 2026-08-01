import type { ActionBuilder, WorkspaceAction } from "@/lib/intelligence/actions/types";

/** `id` da Decision de origem (`decisions/rules/importStaleDataset.ts`) — nunca alterado por este módulo. */
const DECISION_ID = "import-stale-dataset";

/** "Importe um novo relatório" → botão para o Import Center. */
export const updateDatasetActionBuilder: ActionBuilder = {
  id: DECISION_ID,
  description: 'Transforma a Decision "Importe um novo relatório" em uma ação com destino a Importações.',
  build(decisions): WorkspaceAction[] {
    const decision = decisions.find((candidate) => candidate.id === DECISION_ID);
    if (!decision) return [];

    return [
      {
        id: decision.id,
        title: decision.title,
        description: decision.description,
        priority: decision.priority,
        category: "dataset",
        rationale: decision.rationale,
        buttonLabel: "Importar agora",
        href: "/admin/intelligence/importacoes",
      },
    ];
  },
};
