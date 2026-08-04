import { describe, expect, it } from "vitest";
import { contentAudienceCorrelationRule } from "@/lib/intelligence/insights/rules/contentAudienceCorrelation";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const YOUTUBE: IntelligenceDatasetRecord = {
  id: "youtube-1",
  platform: "youtube",
  name: "YouTube",
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
  key: string,
  value: number,
  contentId?: string
): IntelligenceMetricRecord {
  return {
    id,
    dataset_id: contentId ? YOUTUBE.id : INSTAGRAM.id,
    import_id: "import-1",
    content_id: contentId,
    key,
    value,
    measured_at: NOW.toISOString(),
    created_at: NOW.toISOString(),
  };
}

describe("contentAudienceCorrelationRule", () => {
  it("unifica somente correlações high-confidence em Theme ↓ Audience Signal", () => {
    const insights = contentAudienceCorrelationRule.evaluate({
      now: NOW,
      datasets: [YOUTUBE, INSTAGRAM],
      imports: [],
      contents: [content("c1", "Tema A"), content("c2", "Tema B")],
      metrics: [
        metric("subs-1", "subscribers", 30, "c1"),
        metric("watch-1", "watchTimeHours", 60, "c1"),
        metric("subs-2", "subscribers", 5, "c2"),
        metric("watch-2", "watchTimeHours", 10, "c2"),
        metric("growth", "followersDelta", 80),
        metric("activity", "activeFollowers", 900),
      ],
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      ruleId: "content-audience-correlation",
      title: "Content Theme ↓ Audience Signal",
    });
    expect(insights[0]?.message).toContain("Tema A ↓ Audience Growth");
    expect(insights[0]?.message).toContain("Audience Acquisition");
    expect(insights[0]?.message).toContain("Audience Retention");
  });

  it("não cria visão unificada quando só há correlação low-confidence", () => {
    const insights = contentAudienceCorrelationRule.evaluate({
      now: NOW,
      datasets: [YOUTUBE],
      imports: [],
      contents: [content("c1", "Tema A")],
      metrics: [metric("subs-1", "subscribers", 3, "c1")],
    });

    expect(insights).toEqual([]);
  });
});
