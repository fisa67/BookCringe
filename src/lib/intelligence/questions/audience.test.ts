import { describe, expect, it } from "vitest";
import {
  activityPeakQuestion,
  followerGrowthQuestion,
  primaryAudienceQuestion,
  topTerritoryQuestion,
} from "@/lib/intelligence/questions/audience";
import type {
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
  measuredAt = "2026-08-03T12:00:00.000Z"
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

const METRICS = [
  metric("followers", "followers", 1800),
  metric("growth", "followersDelta", 42),
  metric("activity-noon", "activeFollowers", 500),
  metric("activity-evening", "activeFollowers", 920, "2026-08-03T20:00:00.000Z"),
  metric("gender-women", "gender:Mulheres", 0.64),
  metric("gender-men", "gender:Homens", 0.36),
  metric("territory-br", "territory:BR", 0.71),
  metric("territory-pt", "territory:PT", 0.12),
];

describe("Audience Questions", () => {
  it("responde crescimento, pico, território e audiência principal", () => {
    const context = { now: NOW, datasets: [DATASET], metrics: METRICS };

    expect(followerGrowthQuestion.answer(context).data).toMatchObject({
      datasetId: DATASET.id,
      growth: 42,
      followers: 1800,
    });
    expect(activityPeakQuestion.answer(context).data).toMatchObject({
      activeFollowers: 920,
      hour: 20,
    });
    expect(topTerritoryQuestion.answer(context).data).toMatchObject({
      territory: "BR",
      share: 0.71,
    });
    expect(primaryAudienceQuestion.answer(context).data).toMatchObject({
      label: "Mulheres",
      share: 0.64,
    });
  });

  it("não força resposta quando ainda não há métricas de audiência", () => {
    const context = { now: NOW, datasets: [DATASET], metrics: [] };

    for (const question of [
      followerGrowthQuestion,
      activityPeakQuestion,
      topTerritoryQuestion,
      primaryAudienceQuestion,
    ]) {
      const answer = question.answer(context);
      expect(answer.hasAnswer).toBe(false);
      expect(answer.data).toBeNull();
    }
  });
});
