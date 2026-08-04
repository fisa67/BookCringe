import { describe, expect, it } from "vitest";
import { buildIntelligenceDashboardData } from "@/lib/intelligence/dashboard/summary";
import type {
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const AUDIENCE_DATASET: IntelligenceDatasetRecord = {
  id: "instagram-audience",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};
const AUDIENCE_IMPORT: IntelligenceImportRecord = {
  id: "instagram-import",
  dataset_id: AUDIENCE_DATASET.id,
  status: "completed",
  file_name: "audience.xlsx",
  accepted_records: 5,
  rejected_records: 0,
  started_at: NOW.toISOString(),
  finished_at: NOW.toISOString(),
};

function metric(id: string, key: string, value: number, measuredAt = NOW.toISOString()): IntelligenceMetricRecord {
  return {
    id,
    dataset_id: AUDIENCE_DATASET.id,
    import_id: AUDIENCE_IMPORT.id,
    key,
    value,
    measured_at: measuredAt,
    created_at: NOW.toISOString(),
  };
}

describe("Audience visibility regression", () => {
  it("exibe todas as métricas Audience sem exigir Content nem emitir insights de Content incorretos", () => {
    const result = buildIntelligenceDashboardData({
      datasets: [AUDIENCE_DATASET],
      imports: [AUDIENCE_IMPORT],
      contents: [],
      metrics: [
        metric("followers", "followers", 1800),
        metric("growth", "followersDelta", 42),
        metric("activity", "activeFollowers", 920, "2026-08-03T20:00:00.000Z"),
        metric("gender-women", "gender:Mulheres", 0.64),
        metric("gender-men", "gender:Homens", 0.36),
        metric("territory-br", "territory:BR", 0.71),
        metric("territory-pt", "territory:PT", 0.12),
      ],
      books: [],
      now: NOW,
    });

    expect(result.audience).toEqual([
      {
        datasetId: AUDIENCE_DATASET.id,
        datasetName: AUDIENCE_DATASET.name,
        platform: "instagram",
        followers: { value: 1800, measuredAt: NOW.toISOString() },
        followerGrowth: { value: 42, measuredAt: NOW.toISOString() },
        activityPeak: { value: 920, measuredAt: "2026-08-03T20:00:00.000Z" },
        genderDistribution: [
          { label: "Mulheres", value: 0.64 },
          { label: "Homens", value: 0.36 },
        ],
        territoryDistribution: [
          { label: "BR", value: 0.71 },
          { label: "PT", value: 0.12 },
        ],
      },
    ]);

    const ruleIds = result.insights.map((insight) => insight.ruleId);
    expect(ruleIds).not.toContain("low-content-volume");
    expect(ruleIds).not.toContain("unmatched-content");
    expect(ruleIds).not.toContain("top-growth-drivers");
    expect(ruleIds).not.toContain("top-engagement-drivers");
    expect(ruleIds).not.toContain("audience-acquisition-patterns");
    expect(ruleIds).not.toContain("audience-retention-patterns");
    expect(result.insights.every((insight) => !insight.message.includes("só 0 conteúdo"))).toBe(true);
  });
});
