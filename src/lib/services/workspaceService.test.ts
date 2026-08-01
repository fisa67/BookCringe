import { describe, expect, it, vi } from "vitest";
import { getWorkspaceActions } from "./workspaceService";
import type { Decision } from "@/lib/intelligence/decisions";

const { getRecommendedDecisionsMock } = vi.hoisted(() => ({
  getRecommendedDecisionsMock: vi.fn(),
}));

vi.mock("@/lib/services/intelligenceDecisionsService", () => ({
  getRecommendedDecisions: getRecommendedDecisionsMock,
}));

const DECISION: Decision = {
  id: "complete-matching",
  title: "Finalize o Matching de conteúdos",
  description: "5 de 10 conteúdo(s) ainda não estão vinculados a um Livro.",
  priority: "high",
  recommendedAction: "Abra Conteúdos e confirme os matchings sugeridos.",
  rationale: 'Baseado na pergunta "Quanto do meu conteúdo ainda não foi vinculado a um Livro?": ...',
};

describe("getWorkspaceActions", () => {
  it("busca as Decisions via getRecommendedDecisions e devolve as WorkspaceActions calculadas", async () => {
    getRecommendedDecisionsMock.mockResolvedValue([DECISION]);

    const actions = await getWorkspaceActions();

    expect(getRecommendedDecisionsMock).toHaveBeenCalledOnce();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ id: "complete-matching", category: "matching", href: "/admin/intelligence/conteudos" });
  });

  it("devolve lista vazia quando não há nenhuma Decision", async () => {
    getRecommendedDecisionsMock.mockResolvedValue([]);

    const actions = await getWorkspaceActions();

    expect(actions).toEqual([]);
  });
});
