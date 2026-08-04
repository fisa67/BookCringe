import { describe, expect, it } from "vitest";
import {
  bestCampaignQuestion,
  highestAcquisitionQuestion,
  lowestCostPerFollowerQuestion,
  type CampaignQuestionContext,
} from "@/lib/intelligence/questions/campaign";
import type { IntelligenceDatasetRecord, IntelligenceMetricRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

const DATASET: IntelligenceDatasetRecord = {
  id: "tiktok-promotions",
  platform: "tiktok",
  name: "TikTok — Promoções",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

function metric(
  key: string,
  value: number,
  params: { importId: string; measuredAt: string }
): IntelligenceMetricRecord {
  return {
    id: `${params.importId}-${key}`,
    dataset_id: DATASET.id,
    import_id: params.importId,
    key,
    value,
    unit: key === "promo:adCostBrl" ? "BRL" : "count",
    measured_at: params.measuredAt,
    created_at: params.measuredAt,
  };
}

function campaignRow(
  importId: string,
  measuredAt: string,
  values: { adCostBrl: number; views: number; newFollowers: number }
): IntelligenceMetricRecord[] {
  return [
    metric("promo:adCostBrl", values.adCostBrl, { importId, measuredAt }),
    metric("promo:views", values.views, { importId, measuredAt }),
    metric("promo:newFollowers", values.newFollowers, { importId, measuredAt }),
  ];
}

const TWO_CAMPAIGNS_CONTEXT: CampaignQuestionContext = {
  now: NOW,
  datasets: [DATASET],
  imports: [],
  contents: [],
  metrics: [
    ...campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 }),
    ...campaignRow("import-2", "2026-07-08T00:00:00.000Z", { adCostBrl: 800, views: 16000, newFollowers: 200 }),
  ],
};

describe("bestCampaignQuestion", () => {
  it("responde a campanha com menor custo por view, com high confidence quando há 2+ campanhas", () => {
    const answer = bestCampaignQuestion.answer(TWO_CAMPAIGNS_CONTEXT);

    expect(answer.hasAnswer).toBe(true);
    // import-1: 1200/48000 = 0.025; import-2: 800/16000 = 0.05 → import-1 vence.
    expect(answer.data).toMatchObject({ confidence: "high", costPerView: 0.025, views: 48000 });
  });

  it("responde com low confidence quando só há uma campanha com views", () => {
    const context: CampaignQuestionContext = {
      now: NOW,
      datasets: [DATASET],
      imports: [],
      contents: [],
      metrics: campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 }),
    };

    const answer = bestCampaignQuestion.answer(context);
    expect(answer.data?.confidence).toBe("low");
    expect(answer.summary).toContain("Low confidence");
  });

  it("não responde quando não há nenhum Dataset de campanha", () => {
    const answer = bestCampaignQuestion.answer({
      now: NOW,
      datasets: [],
      imports: [],
      contents: [],
      metrics: [],
    });
    expect(answer.hasAnswer).toBe(false);
    expect(answer.data).toBeNull();
  });
});

describe("lowestCostPerFollowerQuestion", () => {
  it("responde a campanha com menor custo por seguidor adquirido", () => {
    const answer = lowestCostPerFollowerQuestion.answer(TWO_CAMPAIGNS_CONTEXT);

    // import-1: 1200/720 ≈ 1.667; import-2: 800/200 = 4 → import-1 vence.
    expect(answer.hasAnswer).toBe(true);
    expect(answer.data?.confidence).toBe("high");
    expect(answer.data?.costPerFollower).toBeCloseTo(1200 / 720);
  });
});

describe("highestAcquisitionQuestion", () => {
  it("responde a campanha com mais seguidores novos, em volume absoluto (não custo)", () => {
    const answer = highestAcquisitionQuestion.answer(TWO_CAMPAIGNS_CONTEXT);

    expect(answer.hasAnswer).toBe(true);
    expect(answer.data).toMatchObject({ confidence: "high", newFollowers: 720 });
  });

  it("não responde quando nenhuma campanha adquiriu seguidores", () => {
    const context: CampaignQuestionContext = {
      now: NOW,
      datasets: [DATASET],
      imports: [],
      contents: [],
      metrics: campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 500, views: 1000, newFollowers: 0 }),
    };

    const answer = highestAcquisitionQuestion.answer(context);
    expect(answer.hasAnswer).toBe(false);
  });
});
