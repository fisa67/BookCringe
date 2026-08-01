import { describe, expect, it } from "vitest";
import { STALE_DATASET_THRESHOLD_DAYS, staleDatasetRule } from "@/lib/intelligence/insights/rules/staleDataset";
import type { IntelligenceDatasetRecord, IntelligenceImportRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function importRow(startedAt: string): IntelligenceImportRecord {
  return {
    id: "import-1",
    dataset_id: DATASET.id,
    status: "completed",
    file_name: "relatorio.csv",
    accepted_records: 1,
    rejected_records: 0,
    started_at: startedAt,
  };
}

describe("staleDatasetRule", () => {
  it("não dispara quando o Dataset não tem nenhum Import", () => {
    const insights = staleDatasetRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents: [], metrics: [] });
    expect(insights).toEqual([]);
  });

  it(`não dispara quando o último Import tem menos de ${STALE_DATASET_THRESHOLD_DAYS} dias`, () => {
    const insights = staleDatasetRule.evaluate({
      now: NOW,
      datasets: [DATASET],
      imports: [importRow("2026-07-15T00:00:00.000Z")],
      contents: [],
      metrics: [],
    });
    expect(insights).toEqual([]);
  });

  it(`dispara quando o último Import tem ${STALE_DATASET_THRESHOLD_DAYS} dias ou mais`, () => {
    const insights = staleDatasetRule.evaluate({
      now: NOW,
      datasets: [DATASET],
      imports: [importRow("2026-06-01T00:00:00.000Z")],
      contents: [],
      metrics: [],
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "stale-dataset:dataset-1",
      ruleId: "stale-dataset",
      severity: "warning",
      title: "Dataset desatualizado",
    });
    expect(insights[0]?.message).toContain("YouTube");
  });

  it("considera só o Import mais recente do Dataset (ignora imports antigos)", () => {
    const insights = staleDatasetRule.evaluate({
      now: NOW,
      datasets: [DATASET],
      imports: [importRow("2026-01-01T00:00:00.000Z"), importRow("2026-07-20T00:00:00.000Z")],
      contents: [],
      metrics: [],
    });

    expect(insights).toEqual([]);
  });

  it("avalia cada Dataset de forma independente", () => {
    const freshDataset: IntelligenceDatasetRecord = { ...DATASET, id: "dataset-2", platform: "instagram" };

    const insights = staleDatasetRule.evaluate({
      now: NOW,
      datasets: [DATASET, freshDataset],
      imports: [
        importRow("2026-06-01T00:00:00.000Z"),
        { ...importRow("2026-07-30T00:00:00.000Z"), id: "import-2", dataset_id: freshDataset.id },
      ],
      contents: [],
      metrics: [],
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]?.id).toBe("stale-dataset:dataset-1");
  });
});
