import { describe, expect, it } from "vitest";
import {
  audienceAcquisitionPatternsRule,
  audienceRetentionPatternsRule,
  topEngagementDriversRule,
  topGrowthDriversRule,
} from "@/lib/intelligence/insights/rules/contentPerformanceInsights";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const YOUTUBE: IntelligenceDatasetRecord = {
  id: "youtube-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};
const INSTAGRAM: IntelligenceDatasetRecord = {
  id: "instagram-1",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

function content(id: string, title: string): IntelligenceContentRecord {
  return {
    id,
    dataset_id: YOUTUBE.id,
    title,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

function metric(
  id: string,
  contentId: string | undefined,
  datasetId: string,
  key: string,
  value: number
): IntelligenceMetricRecord {
  return {
    id,
    dataset_id: datasetId,
    import_id: "import-1",
    content_id: contentId,
    key,
    value,
    measured_at: NOW.toISOString(),
    created_at: NOW.toISOString(),
  };
}

describe("Content Performance Insights", () => {
  it("emits the four evidence-based insight families", () => {
    const context = {
      now: NOW,
      datasets: [YOUTUBE, INSTAGRAM],
      imports: [],
      contents: [content("c1", "A"), content("c2", "B")],
      metrics: [
        metric("1", "c1", YOUTUBE.id, "views", 1000),
        metric("2", "c1", YOUTUBE.id, "watchTimeHours", 40),
        metric("3", "c1", YOUTUBE.id, "subscribers", 25),
        metric("4", "c2", YOUTUBE.id, "views", 3000),
        metric("5", "c2", YOUTUBE.id, "watchTimeHours", 5),
        metric("6", "c2", YOUTUBE.id, "subscribers", 4),
        metric("7", undefined, INSTAGRAM.id, "followersDelta", 50),
        metric("8", undefined, INSTAGRAM.id, "activeFollowers", 800),
      ],
    };

    expect(topGrowthDriversRule.evaluate(context)[0]?.title).toBe("Top Growth Drivers");
    expect(topEngagementDriversRule.evaluate(context)[0]?.title).toBe("Top Engagement Drivers");
    expect(audienceAcquisitionPatternsRule.evaluate(context)[0]?.title).toBe(
      "Audience Acquisition Patterns"
    );
    expect(audienceRetentionPatternsRule.evaluate(context)[0]?.title).toBe(
      "Audience Retention Patterns"
    );
  });

  it("uses low-confidence mode when evidence is incomplete", () => {
    const insights = topGrowthDriversRule.evaluate({
      now: NOW,
      datasets: [YOUTUBE],
      imports: [],
      contents: [content("c1", "Only")],
      metrics: [metric("1", "c1", YOUTUBE.id, "subscribers", 3)],
    });

    expect(insights[0]?.message).toContain("Low confidence");
  });
});
