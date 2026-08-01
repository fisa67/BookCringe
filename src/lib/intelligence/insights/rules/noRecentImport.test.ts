import { describe, expect, it } from "vitest";
import { RECENT_IMPORT_THRESHOLD_DAYS, noRecentImportRule } from "@/lib/intelligence/insights/rules/noRecentImport";
import type { IntelligenceImportRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function importRow(id: string, startedAt: string): IntelligenceImportRecord {
  return {
    id,
    dataset_id: "dataset-1",
    status: "completed",
    file_name: "relatorio.csv",
    accepted_records: 1,
    rejected_records: 0,
    started_at: startedAt,
  };
}

describe("noRecentImportRule", () => {
  it("não dispara quando não existe nenhum Import (a tela vazia já cobre esse caso)", () => {
    const insights = noRecentImportRule.evaluate({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] });
    expect(insights).toEqual([]);
  });

  it(`não dispara quando o Import mais recente tem menos de ${RECENT_IMPORT_THRESHOLD_DAYS} dias`, () => {
    const insights = noRecentImportRule.evaluate({
      now: NOW,
      datasets: [],
      imports: [importRow("import-1", "2026-07-25T00:00:00.000Z")],
      contents: [],
      metrics: [],
    });
    expect(insights).toEqual([]);
  });

  it(`dispara quando o Import mais recente tem ${RECENT_IMPORT_THRESHOLD_DAYS} dias ou mais`, () => {
    const insights = noRecentImportRule.evaluate({
      now: NOW,
      datasets: [],
      imports: [importRow("import-1", "2026-07-01T00:00:00.000Z")],
      contents: [],
      metrics: [],
    });

    expect(insights).toEqual([
      {
        id: "no-recent-import",
        ruleId: "no-recent-import",
        severity: "warning",
        title: "Nenhuma importação recente",
        message: expect.stringContaining("31 dias"),
      },
    ]);
  });

  it("considera o Import mais recente entre todas as plataformas, não só uma", () => {
    const insights = noRecentImportRule.evaluate({
      now: NOW,
      datasets: [],
      imports: [importRow("import-old", "2026-05-01T00:00:00.000Z"), importRow("import-new", "2026-07-30T00:00:00.000Z")],
      contents: [],
      metrics: [],
    });

    expect(insights).toEqual([]);
  });
});
