import { describe, expect, it } from "vitest";
import { ACTION_BUILDERS, buildWorkspaceActions } from "@/lib/intelligence/actions/engine";
import type { Decision } from "@/lib/intelligence/decisions";

function decision(overrides: Partial<Decision>): Decision {
  return {
    id: "repeat-best-theme",
    title: "Título",
    description: "Descrição",
    priority: "medium",
    recommendedAction: "Ação",
    rationale: "Justificativa",
    ...overrides,
  } as Decision;
}

describe("ACTION_BUILDERS", () => {
  it("lista os 3 builders da Sprint 12, um por Decision existente", () => {
    expect(ACTION_BUILDERS.map((builder) => builder.id)).toEqual([
      "repeat-best-theme",
      "import-stale-dataset",
      "complete-matching",
    ]);
  });
});

describe("buildWorkspaceActions", () => {
  it("não gera nenhuma ação quando não há nenhuma Decision", () => {
    expect(buildWorkspaceActions([])).toEqual([]);
  });

  it("converte cada Decision reconhecida na sua WorkspaceAction correspondente", () => {
    const decisions: Decision[] = [
      decision({ id: "repeat-best-theme", priority: "medium" }),
      decision({ id: "import-stale-dataset", priority: "medium" }),
      decision({ id: "complete-matching", priority: "medium" }),
    ];

    const actions = buildWorkspaceActions(decisions);

    expect(actions.map((action) => action.id)).toEqual(
      expect.arrayContaining(["repeat-best-theme", "import-stale-dataset", "complete-matching"])
    );
    expect(actions).toHaveLength(3);
  });

  it("ignora Decisions sem builder correspondente, sem lançar erro", () => {
    const actions = buildWorkspaceActions([decision({ id: "decision-desconhecida" })]);
    expect(actions).toEqual([]);
  });

  it("ordena as ações por prioridade (high antes de medium antes de low)", () => {
    const decisions: Decision[] = [
      decision({ id: "repeat-best-theme", priority: "medium" }),
      decision({ id: "import-stale-dataset", priority: "high" }),
      decision({ id: "complete-matching", priority: "low" }),
    ];

    const actions = buildWorkspaceActions(decisions);

    expect(actions.map((action) => action.id)).toEqual([
      "import-stale-dataset",
      "repeat-best-theme",
      "complete-matching",
    ]);
  });
});
