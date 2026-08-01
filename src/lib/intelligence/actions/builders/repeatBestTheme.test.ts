import { describe, expect, it } from "vitest";
import { repeatBestThemeActionBuilder } from "@/lib/intelligence/actions/builders/repeatBestTheme";
import type { Decision } from "@/lib/intelligence/decisions";

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: "repeat-best-theme",
    title: "Repita o que já funcionou",
    description: '"Como ler mais em 2026" (YouTube) foi o conteúdo com melhor desempenho.',
    priority: "medium",
    recommendedAction: 'Planeje um novo conteúdo com um tema semelhante ao de "Como ler mais em 2026".',
    rationale: 'Baseado na pergunta "Qual foi meu melhor conteúdo?": ...',
    ...overrides,
  } as Decision;
}

describe("repeatBestThemeActionBuilder", () => {
  it("não gera ação quando a Decision correspondente não existe", () => {
    const actions = repeatBestThemeActionBuilder.build([decision({ id: "complete-matching" })]);
    expect(actions).toEqual([]);
  });

  it("transforma a Decision em uma WorkspaceAction com destino a Livros", () => {
    const actions = repeatBestThemeActionBuilder.build([decision()]);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "repeat-best-theme",
      title: "Repita o que já funcionou",
      priority: "medium",
      category: "book",
      buttonLabel: "Ver Livros",
      href: "/admin/books",
    });
  });

  it("preserva a descrição e a justificativa exatamente como vieram da Decision", () => {
    const source = decision({ description: "Descrição X", rationale: "Justificativa Y" });
    const [action] = repeatBestThemeActionBuilder.build([source]);

    expect(action?.description).toBe("Descrição X");
    expect(action?.rationale).toBe("Justificativa Y");
  });

  it("toda WorkspaceAction contém título, descrição, prioridade, categoria, justificativa, botão e destino", () => {
    const [action] = repeatBestThemeActionBuilder.build([decision()]);

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
