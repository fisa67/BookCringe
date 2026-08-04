import { describe, expect, it } from "vitest";
import {
  audienceContentAlignmentRule,
  audienceEmergingTerritoriesRule,
  audienceGrowthLeadersRule,
  audienceUnderservedSegmentsRule,
} from "@/lib/intelligence/insights/rules/audienceInsights";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const DATASET: IntelligenceDatasetRecord = {
  id: "instagram-audience",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

function metric(
  id: string,
  key: string,
  value: number,
  measuredAt: string
): IntelligenceMetricRecord {
  return {
    id,
    dataset_id: DATASET.id,
    import_id: "import-1",
    key,
    value,
    measured_at: measuredAt,
    created_at: NOW.toISOString(),
  };
}

function content(id: string, bookId?: string): IntelligenceContentRecord {
  return {
    id,
    dataset_id: "youtube-1",
    title: `Content ${id}`,
    book_id: bookId,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

describe("Audience Insights", () => {
  it("emits growth leaders from evidence and low-confidence otherwise", () => {
    const high = audienceGrowthLeadersRule.evaluate({
      now: NOW,
      datasets: [DATASET],
      imports: [],
      contents: [],
      metrics: [
        metric("g1", "gender:Mulheres", 0.5, "2026-07-01T00:00:00.000Z"),
        metric("g2", "gender:Homens", 0.5, "2026-07-01T00:00:00.000Z"),
        metric("g3", "gender:Mulheres", 0.6, "2026-08-01T00:00:00.000Z"),
        metric("g4", "gender:Homens", 0.4, "2026-08-01T00:00:00.000Z"),
      ],
    });
    expect(high[0]).toMatchObject({ title: "Growth Leaders", ruleId: "audience-growth-leaders" });
    expect(high[0]?.message).toContain("Mulheres");

    const low = audienceGrowthLeadersRule.evaluate({
      now: NOW,
      datasets: [DATASET],
      imports: [],
      contents: [],
      metrics: [metric("g1", "gender:Mulheres", 0.7, "2026-08-01T00:00:00.000Z")],
    });
    expect(low[0]?.message).toContain("Low confidence");
  });

  it("emits underserved, emerging territory and alignment insights", () => {
    const metrics = [
      metric("g1", "gender:Mulheres", 0.7, "2026-08-01T00:00:00.000Z"),
      metric("g2", "gender:Homens", 0.3, "2026-08-01T00:00:00.000Z"),
      metric("t1", "territory:BR", 0.7, "2026-07-01T00:00:00.000Z"),
      metric("t2", "territory:MX", 0.1, "2026-07-01T00:00:00.000Z"),
      metric("t3", "territory:BR", 0.6, "2026-08-01T00:00:00.000Z"),
      metric("t4", "territory:MX", 0.25, "2026-08-01T00:00:00.000Z"),
    ];
    const contents = [content("c1"), content("c2"), content("c3", "book-1")];

    expect(
      audienceUnderservedSegmentsRule.evaluate({
        now: NOW,
        datasets: [DATASET],
        imports: [],
        contents,
        metrics,
      })[0]?.title
    ).toBe("Underserved Segments");

    expect(
      audienceEmergingTerritoriesRule.evaluate({
        now: NOW,
        datasets: [DATASET],
        imports: [],
        contents: [],
        metrics,
      })[0]?.message
    ).toContain("MX");

    expect(
      audienceContentAlignmentRule.evaluate({
        now: NOW,
        datasets: [DATASET],
        imports: [],
        contents,
        metrics,
      })[0]
    ).toMatchObject({
      title: "Audience/Content Alignment",
      severity: "warning",
    });
  });
});
