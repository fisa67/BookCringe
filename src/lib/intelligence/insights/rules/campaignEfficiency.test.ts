import { describe, expect, it } from "vitest";
import { campaignEfficiencyRule } from "@/lib/intelligence/insights/rules/campaignEfficiency";
import type { IntelligenceDatasetRecord, IntelligenceMetricRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

const DATASET: IntelligenceDatasetRecord = {
  id: "tiktok-promotions",
  platform: "tiktok",
  name: "TikTok — Promoções",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

function metric(key: string, value: number, params: { importId: string; measuredAt: string }): IntelligenceMetricRecord {
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

describe("campaignEfficiencyRule", () => {
  it("não dispara para Datasets sem nenhuma métrica promo:", () => {
    const insights = campaignEfficiencyRule.evaluate({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] });
    expect(insights).toEqual([]);
  });

  it("gera info com low confidence quando só há uma campanha com custo por seguidor calculável", () => {
    const metrics = campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 });

    const insights = campaignEfficiencyRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents: [], metrics });

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({ severity: "info", title: "Eficiência de campanha" });
    expect(insights[0].message).toContain("Low confidence");
  });

  it("gera warning quando a pior campanha custa 1.5x ou mais por seguidor que a melhor", () => {
    const metrics = [
      ...campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 }), // R$1.67/seguidor
      ...campaignRow("import-2", "2026-07-08T00:00:00.000Z", { adCostBrl: 800, views: 16000, newFollowers: 80 }), // R$10/seguidor
    ];

    const insights = campaignEfficiencyRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents: [], metrics });

    expect(insights).toHaveLength(1);
    expect(insights[0].severity).toBe("warning");
    expect(insights[0].message).toContain("mais por seguidor");
  });

  it("gera info sem warning quando as campanhas têm eficiência parecida", () => {
    const metrics = [
      ...campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 }), // R$1.67/seguidor
      ...campaignRow("import-2", "2026-07-08T00:00:00.000Z", { adCostBrl: 800, views: 16000, newFollowers: 400 }), // R$2.00/seguidor
    ];

    const insights = campaignEfficiencyRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents: [], metrics });

    expect(insights).toHaveLength(1);
    expect(insights[0].severity).toBe("info");
    expect(insights[0].message).not.toContain("Low confidence");
  });

  it("ignora campanhas sem seguidores adquiridos (costPerFollower nulo) ao montar a comparação", () => {
    const metrics = [
      ...campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 }),
      ...campaignRow("import-2", "2026-07-08T00:00:00.000Z", { adCostBrl: 300, views: 5000, newFollowers: 0 }),
    ];

    const insights = campaignEfficiencyRule.evaluate({ now: NOW, datasets: [DATASET], imports: [], contents: [], metrics });

    expect(insights).toHaveLength(1);
    expect(insights[0].message).toContain("Low confidence");
  });
});
