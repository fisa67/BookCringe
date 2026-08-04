import { describe, expect, it } from "vitest";
import { MIN_CONTENTS_PER_DATASET, lowContentVolumeRule } from "@/lib/intelligence/insights/rules/lowContentVolume";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function content(id: string): IntelligenceContentRecord {
  return {
    id,
    dataset_id: DATASET.id,
    title: `Vídeo ${id}`,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
}

describe("lowContentVolumeRule", () => {
  it(`dispara quando o Dataset tem menos de ${MIN_CONTENTS_PER_DATASET} Contents`, () => {
    const insights = lowContentVolumeRule.evaluate({
      now: NOW,
      datasets: [DATASET],
      imports: [],
      contents: [content("c1"), content("c2")],
      metrics: [],
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "low-content-volume:dataset-1",
      ruleId: "low-content-volume",
      severity: "info",
      title: "Pouco conteúdo associado",
    });
  });

  it(`não dispara quando o Dataset já tem ${MIN_CONTENTS_PER_DATASET} Contents ou mais`, () => {
    const contents = Array.from({ length: MIN_CONTENTS_PER_DATASET }, (_, index) => content(`c${index}`));

    const insights = lowContentVolumeRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents, metrics: [] });
    expect(insights).toEqual([]);
  });

  it("dispara para um Dataset sem nenhum Content", () => {
    const insights = lowContentVolumeRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents: [], metrics: [] });
    expect(insights).toHaveLength(1);
  });

  it("não avalia Dataset de audiência pela quantidade de Contents", () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    const audienceMetric: IntelligenceMetricRecord = {
      id: "metric-followers",
      dataset_id: audienceDataset.id,
      import_id: "import-instagram",
      key: "followers",
      value: 1200,
      unit: "count",
      measured_at: NOW.toISOString(),
      created_at: NOW.toISOString(),
    };

    const insights = lowContentVolumeRule.evaluate({
      now: NOW,
      datasets: [DATASET, audienceDataset],
      imports: [],
      contents: [],
      metrics: [audienceMetric],
    });

    expect(insights.map((insight) => insight.id)).toEqual(["low-content-volume:dataset-1"]);
  });

  it("não avalia Dataset de campanha (promo:) pela quantidade de Contents", () => {
    const campaignDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "tiktok-promotions",
      platform: "tiktok",
      name: "TikTok — Promoções",
    };
    const campaignMetric: IntelligenceMetricRecord = {
      id: "metric-ad-cost",
      dataset_id: campaignDataset.id,
      import_id: "import-tiktok",
      key: "promo:adCostBrl",
      value: 1200,
      unit: "BRL",
      measured_at: NOW.toISOString(),
      created_at: NOW.toISOString(),
    };

    const insights = lowContentVolumeRule.evaluate({
      now: NOW,
      datasets: [DATASET, campaignDataset],
      imports: [],
      contents: [],
      metrics: [campaignMetric],
    });

    expect(insights.map((insight) => insight.id)).toEqual(["low-content-volume:dataset-1"]);
  });
});
