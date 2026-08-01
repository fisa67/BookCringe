import type { ImportSessionStage } from "@/lib/intelligence/session/types";

export type ImportStepId = "select" | "preview" | "validate" | "ready";
export type ImportStepStatus = "done" | "current" | "blocked" | "pending";

export const IMPORT_STEPS: readonly { id: ImportStepId; label: string }[] = [
  { id: "select", label: "Selecionar arquivo" },
  { id: "preview", label: "Detection Preview" },
  { id: "validate", label: "Validação" },
  { id: "ready", label: "Pronto para importar" },
] as const;

/**
 * Mapeia o estágio da Import Session para o status visual de cada uma das 4
 * etapas do Import Center. Puramente derivado do `stage` — nenhuma etapa
 * tem estado próprio além do que já existe na sessão.
 */
export function getImportStepStatus(stepId: ImportStepId, stage: ImportSessionStage): ImportStepStatus {
  switch (stage) {
    case "idle":
      return stepId === "select" ? "current" : "pending";

    case "detecting":
      if (stepId === "select") return "done";
      if (stepId === "preview") return "current";
      return "pending";

    case "error":
      if (stepId === "select") return "done";
      if (stepId === "preview") return "blocked";
      return "pending";

    case "validating":
      if (stepId === "select" || stepId === "preview") return "done";
      if (stepId === "validate") return "current";
      return "pending";

    case "blocked":
      if (stepId === "select" || stepId === "preview") return "done";
      if (stepId === "validate") return "blocked";
      return "pending";

    case "ready":
    case "importing":
      return stepId === "ready" ? "current" : "done";

    case "imported":
      return "done";

    case "import_error":
      return stepId === "ready" ? "blocked" : "done";

    default:
      return "pending";
  }
}
