import { describe, expect, it } from "vitest";
import { getImportStepStatus } from "@/lib/intelligence/session/stepper";

describe("getImportStepStatus", () => {
  it("na etapa idle, só 'select' está current", () => {
    expect(getImportStepStatus("select", "idle")).toBe("current");
    expect(getImportStepStatus("preview", "idle")).toBe("pending");
    expect(getImportStepStatus("validate", "idle")).toBe("pending");
    expect(getImportStepStatus("ready", "idle")).toBe("pending");
  });

  it("na etapa detecting, 'select' concluído e 'preview' current", () => {
    expect(getImportStepStatus("select", "detecting")).toBe("done");
    expect(getImportStepStatus("preview", "detecting")).toBe("current");
    expect(getImportStepStatus("validate", "detecting")).toBe("pending");
  });

  it("na etapa error, 'preview' fica bloqueado", () => {
    expect(getImportStepStatus("select", "error")).toBe("done");
    expect(getImportStepStatus("preview", "error")).toBe("blocked");
    expect(getImportStepStatus("validate", "error")).toBe("pending");
  });

  it("na etapa validating, 'select' e 'preview' concluídos e 'validate' current", () => {
    expect(getImportStepStatus("select", "validating")).toBe("done");
    expect(getImportStepStatus("preview", "validating")).toBe("done");
    expect(getImportStepStatus("validate", "validating")).toBe("current");
    expect(getImportStepStatus("ready", "validating")).toBe("pending");
  });

  it("na etapa blocked, 'validate' fica bloqueado e 'ready' pendente", () => {
    expect(getImportStepStatus("validate", "blocked")).toBe("blocked");
    expect(getImportStepStatus("ready", "blocked")).toBe("pending");
  });

  it("na etapa ready, as 3 primeiras etapas ficam concluídas e a última current", () => {
    expect(getImportStepStatus("select", "ready")).toBe("done");
    expect(getImportStepStatus("preview", "ready")).toBe("done");
    expect(getImportStepStatus("validate", "ready")).toBe("done");
    expect(getImportStepStatus("ready", "ready")).toBe("current");
  });

  it("na etapa importing, a última etapa continua current", () => {
    expect(getImportStepStatus("select", "importing")).toBe("done");
    expect(getImportStepStatus("ready", "importing")).toBe("current");
  });

  it("na etapa imported, todas as etapas ficam concluídas", () => {
    expect(getImportStepStatus("select", "imported")).toBe("done");
    expect(getImportStepStatus("preview", "imported")).toBe("done");
    expect(getImportStepStatus("validate", "imported")).toBe("done");
    expect(getImportStepStatus("ready", "imported")).toBe("done");
  });

  it("na etapa import_error, a última etapa fica bloqueada e as demais concluídas", () => {
    expect(getImportStepStatus("select", "import_error")).toBe("done");
    expect(getImportStepStatus("validate", "import_error")).toBe("done");
    expect(getImportStepStatus("ready", "import_error")).toBe("blocked");
  });
});
