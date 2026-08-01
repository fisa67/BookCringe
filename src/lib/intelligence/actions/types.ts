import type { Decision, DecisionPriority } from "@/lib/intelligence/decisions";

/**
 * Workspace (Sprint 12, `docs/intelligence/WORKSPACE.md`): terceira camada
 * de inteligência, construída sobre a Decision Engine (Sprint 11) — sem
 * IA, sem LLM, mesma restrição das camadas anteriores.
 *
 * Diferença central em relação a uma Decision: uma Decision descreve uma
 * recomendação em texto (título, descrição, ação recomendada em prosa).
 * Uma WorkspaceAction é a mesma recomendação já pronta para ser **clicada**
 * — com destino (`href`) e texto de botão (`buttonLabel`) — para o
 * Dashboard virar uma central de trabalho diário, não só um mural de
 * avisos.
 */

export type WorkspaceActionCategory = "book" | "dataset" | "matching";

export interface WorkspaceAction {
  id: string;
  title: string;
  description: string;
  priority: DecisionPriority;
  category: WorkspaceActionCategory;
  /** Justificativa baseada em dados — herdada diretamente do `rationale` da Decision de origem. */
  rationale: string;
  buttonLabel: string;
  href: string;
}

/**
 * Um Action Builder transforma exatamente uma Decision (buscada pelo seu
 * `id` dentro de `Decision[]`) em uma WorkspaceAction. Nunca acessa o
 * banco, nunca importa um service — só enxerga o array de Decisions já
 * calculado (mesma restrição que a Decision Engine já aplica em relação a
 * `QuestionAnswer`: cada camada só consome o contrato estável da camada
 * anterior).
 */
export interface ActionBuilder {
  /** Igual ao `id` da Decision que este builder transforma. */
  id: string;
  description: string;
  build(decisions: Decision[]): WorkspaceAction[];
}
