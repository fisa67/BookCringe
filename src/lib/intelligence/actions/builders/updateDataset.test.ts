import { describe, expect, it } from "vitest";
import { updateDatasetActionBuilder } from "@/lib/intelligence/actions/builders/updateDataset";
import type { Decision } from "@/lib/intelligence/decisions";

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: "import-stale-dataset",
    title: "Importe um novo relatório",
    description: 'O Dataset "YouTube Studio — Desempenho de vídeos" não recebe uma nova importação há 45 dias.',
    priority: "high",
    recommendedAction: "Abra o Import Center e importe um relatório mais recente.",
    rationale: 'Baseado na pergunta "Qual é o Dataset mais desatualizado?": ...',
    ...overrides,
  } as Decision;
}

describe("updateDatasetActionBuilder", () => {
  it("não gera ação quando a Decision correspondente não existe", () => {
    const actions = updateDatasetActionBuilder.build([decision({ id: "complete-matching" })]);
    expect(actions).toEqual([]);
  });

  it("transforma a Decision em uma WorkspaceAction com destino a Importações", () => {
    const actions = updateDatasetActionBuilder.build([decision()]);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "import-stale-dataset",
      title: "Importe um novo relatório",
      priority: "high",
      category: "dataset",
      buttonLabel: "Importar agora",
      href: "/admin/intelligence/importacoes",
    });
  });

  it("toda WorkspaceAction contém título, descrição, prioridade, categoria, justificativa, botão e destino", () => {
    const [action] = updateDatasetActionBuilder.build([decision()]);

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
