import { describe, expect, it } from "vitest";
import { INTELLIGENCE_RULES, runIntelligenceRules } from "@/lib/intelligence/insights/engine";
import type { IntelligenceDatasetRecord, IntelligenceImportRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

describe("runIntelligenceRules", () => {
  it("em um cenário totalmente vazio, só a ausência do Dataset do YouTube é apontada", () => {
    const insights = runIntelligenceRules({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] });
    expect(insights.map((insight) => insight.ruleId)).toEqual(["platform-without-dataset"]);
  });

  it("agrega os insights de todas as regras registradas", () => {
    const dataset: IntelligenceDatasetRecord = {
      id: "dataset-1",
      platform: "instagram",
      name: "Instagram — Reels",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const staleImport: IntelligenceImportRecord = {
      id: "import-1",
      dataset_id: dataset.id,
      status: "completed",
      file_name: "reels.csv",
      accepted_records: 1,
      rejected_records: 0,
      started_at: "2026-01-01T00:00:00.000Z",
    };

    const insights = runIntelligenceRules({ now: NOW, datasets: [dataset], imports: [staleImport], contents: [], metrics: [] });
    const ruleIds = new Set(insights.map((insight) => insight.ruleId));

    // Dataset "instagram" antigo e sem Contents dispara stale-dataset,
    // low-content-volume e no-recent-import; platform-without-dataset
    // dispara porque o YouTube (única plataforma com persistência) não
    // tem Dataset nenhum.
    expect(ruleIds).toEqual(new Set(["stale-dataset", "low-content-volume", "no-recent-import", "platform-without-dataset"]));
  });

  it("expõe todas as regras cadastradas com id único", () => {
    const ids = INTELLIGENCE_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "stale-dataset",
      "low-content-volume",
      "no-recent-import",
      "unmatched-content",
      "platform-without-dataset",
    ]);
  });
});
