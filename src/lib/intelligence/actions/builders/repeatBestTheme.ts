import type { ActionBuilder, WorkspaceAction } from "@/lib/intelligence/actions/types";

/** `id` da Decision de origem (`decisions/rules/repeatBestTheme.ts`) — nunca alterado por este módulo. */
const DECISION_ID = "repeat-best-theme";

/**
 * "Repita o que já funcionou" → botão para a área de Livros: o
 * Action Builder só enxerga `Decision[]`, nunca sabe qual Livro
 * especificamente (a Decision não carrega um `bookId`, só texto) — por
 * isso o destino é a listagem, não uma edição direta.
 */
export const repeatBestThemeActionBuilder: ActionBuilder = {
  id: DECISION_ID,
  description: 'Transforma a Decision "Repita o que já funcionou" em uma ação com destino a Livros.',
  build(decisions): WorkspaceAction[] {
    const decision = decisions.find((candidate) => candidate.id === DECISION_ID);
    if (!decision) return [];

    return [
      {
        id: decision.id,
        title: decision.title,
        description: decision.description,
        priority: decision.priority,
        category: "book",
        rationale: decision.rationale,
        buttonLabel: "Ver Livros",
        href: "/admin/books",
      },
    ];
  },
};
