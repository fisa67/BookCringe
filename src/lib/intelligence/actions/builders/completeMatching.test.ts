import { describe, expect, it } from "vitest";
import { completeMatchingActionBuilder } from "@/lib/intelligence/actions/builders/completeMatching";
import type { Decision } from "@/lib/intelligence/decisions";

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: "complete-matching",
    title: "Finalize o Matching de conteúdos",
    description: "5 de 10 conteúdo(s) ainda não estão vinculados a um Livro.",
    priority: "high",
    recommendedAction: "Abra Conteúdos e confirme os matchings sugeridos.",
    rationale: 'Baseado na pergunta "Quanto do meu conteúdo ainda não foi vinculado a um Livro?": ...',
    ...overrides,
  } as Decision;
}

describe("completeMatchingActionBuilder", () => {
  it("não gera ação quando a Decision correspondente não existe", () => {
    const actions = completeMatchingActionBuilder.build([decision({ id: "repeat-best-theme" })]);
    expect(actions).toEqual([]);
  });

  it("transforma a Decision em uma WorkspaceAction com destino a Matching", () => {
    const actions = completeMatchingActionBuilder.build([decision()]);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "complete-matching",
      title: "Finalize o Matching de conteúdos",
      priority: "high",
      category: "matching",
      buttonLabel: "Ver Matching",
      href: "/admin/intelligence/conteudos",
    });
  });

  it("toda WorkspaceAction contém título, descrição, prioridade, categoria, justificativa, botão e destino", () => {
    const [action] = completeMatchingActionBuilder.build([decision()]);

    expect(action).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      priority: expect.any(String),
      category: expect.any(String),
      rationale: expect.any(String),
      buttonLabel: expect.any(String),
      href: expect.any(String),
    });
  });
});
