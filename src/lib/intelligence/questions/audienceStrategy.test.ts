import { describe, expect, it } from "vitest";
import {
  audienceContentMismatchQuestion,
  fastestGrowingSegmentQuestion,
  territoryGrowthOpportunityQuestion,
  underservedSegmentQuestion,
} from "@/lib/intelligence/questions/audienceStrategy";
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

describe("Audience Strategy Questions", () => {
  it("identifies the fastest-growing segment from two gender snapshots", () => {
    const metrics = [
      metric("g1", "gender:Mulheres", 0.55, "2026-07-01T00:00:00.000Z"),
      metric("g2", "gender:Homens", 0.45, "2026-07-01T00:00:00.000Z"),
      metric("g3", "gender:Mulheres", 0.62, "2026-08-01T00:00:00.000Z"),
      metric("g4", "gender:Homens", 0.38, "2026-08-01T00:00:00.000Z"),
    ];

    const answer = fastestGrowingSegmentQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      metrics,
      contents: [],
    });

    expect(answer.hasAnswer).toBe(true);
    expect(answer.data).toMatchObject({
      segment: "Mulheres",
      confidence: "high",
      shareDelta: expect.closeTo(0.07, 5),
    });
  });

  it("returns low-confidence growth when only one snapshot exists", () => {
    const answer = fastestGrowingSegmentQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      metrics: [metric("g1", "gender:Mulheres", 0.7, "2026-08-01T00:00:00.000Z")],
      contents: [],
    });

    expect(answer.data?.confidence).toBe("low");
    expect(answer.summary).toContain("Low confidence");
  });

  it("flags a meaningful secondary segment as underserved", () => {
    const answer = underservedSegmentQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      metrics: [
        metric("g1", "gender:Mulheres", 0.68, "2026-08-01T00:00:00.000Z"),
        metric("g2", "gender:Homens", 0.32, "2026-08-01T00:00:00.000Z"),
      ],
      contents: [content("c1", "book-1")],
    });

    expect(answer.data).toMatchObject({
      segment: "Homens",
      confidence: "high",
      contentsCount: 1,
    });
  });

  it("identifies territory growth opportunity from snapshot deltas", () => {
    const answer = territoryGrowthOpportunityQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      metrics: [
        metric("t1", "territory:BR", 0.7, "2026-07-01T00:00:00.000Z"),
        metric("t2", "territory:MX", 0.1, "2026-07-01T00:00:00.000Z"),
        metric("t3", "territory:BR", 0.65, "2026-08-01T00:00:00.000Z"),
        metric("t4", "territory:MX", 0.2, "2026-08-01T00:00:00.000Z"),
      ],
      contents: [],
    });

    expect(answer.data).toMatchObject({
      territory: "MX",
      confidence: "high",
      shareDelta: expect.closeTo(0.1, 5),
    });
  });

  it("detects audience/content mismatch with evidence", () => {
    const answer = audienceContentMismatchQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      metrics: [
        metric("g1", "gender:Mulheres", 0.72, "2026-08-01T00:00:00.000Z"),
        metric("g2", "gender:Homens", 0.28, "2026-08-01T00:00:00.000Z"),
      ],
      contents: [content("c1"), content("c2"), content("c3", "book-1")],
    });

    expect(answer.data).toMatchObject({
      mismatched: true,
      confidence: "high",
      unmatchedRatio: expect.closeTo(2 / 3, 5),
    });
  });
});
