import type { ActionBuilder, WorkspaceAction } from "@/lib/intelligence/actions/types";

/** `id` da Decision de origem (`decisions/rules/completeMatching.ts`) — nunca alterado por este módulo. */
const DECISION_ID = "complete-matching";

/** "Finalize o Matching de conteúdos" → botão para a tela de Matching. */
export const completeMatchingActionBuilder: ActionBuilder = {
  id: DECISION_ID,
  description: 'Transforma a Decision "Finalize o Matching de conteúdos" em uma ação com destino a Matching.',
  build(decisions): WorkspaceAction[] {
    const decision = decisions.find((candidate) => candidate.id === DECISION_ID);
    if (!decision) return [];

    return [
      {
        id: decision.id,
        title: decision.title,
        description: decision.description,
        priority: decision.priority,
        category: "matching",
        rationale: decision.rationale,
        buttonLabel: "Ver Matching",
        href: "/admin/intelligence/conteudos",
      },
    ];
  },
};
