import { describe, expect, it } from "vitest";
import { INTELLIGENCE_RULES, runIntelligenceRules } from "@/lib/intelligence/insights/engine";
import type { IntelligenceDatasetRecord, IntelligenceImportRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

describe("runIntelligenceRules", () => {
  it("em um cenário vazio, aponta as plataformas com persistência e sem Dataset", () => {
    const insights = runIntelligenceRules({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] });
    expect(insights.map((insight) => insight.ruleId)).toEqual([
      "platform-without-dataset",
      "platform-without-dataset",
      "platform-without-dataset",
    ]);
    expect(insights.map((insight) => insight.id)).toEqual([
      "platform-without-dataset:youtube",
      "platform-without-dataset:instagram",
      "platform-without-dataset:tiktok",
    ]);
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
    // dispara só uma vez (para o YouTube) porque o Instagram já tem este
    // Dataset — ainda que "Instagram — Reels" não seja o Dataset de
    // audiência da Sprint 14, o suficiente para a regra (que só olha
    // `dataset.platform`) considerar a plataforma coberta.
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
      "audience-growth-leaders",
      "audience-underserved-segments",
      "audience-emerging-territories",
      "audience-content-alignment",
      "top-growth-drivers",
      "top-engagement-drivers",
      "audience-acquisition-patterns",
      "audience-retention-patterns",
      "content-audience-correlation",
      "campaign-efficiency",
    ]);
  });
});
