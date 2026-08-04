import { describe, expect, it } from "vitest";
import {
  buildCampaignDatasetSummaries,
  campaignEntryLabel,
  isCampaignDataset,
  isCampaignMetric,
} from "@/lib/intelligence/campaign/summary";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "tiktok",
  name: "TikTok — Promoções",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

function metric(
  key: string,
  value: number,
  params: { measuredAt: string; importId: string; contentId?: string; id: string }
): IntelligenceMetricRecord {
  return {
    id: params.id,
    dataset_id: DATASET.id,
    import_id: params.importId,
    content_id: params.contentId,
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
  values: { adCostBrl: number; views: number; newFollowers: number },
  contentId?: string,
  rowId = measuredAt
): IntelligenceMetricRecord[] {
  return [
    metric("promo:adCostBrl", values.adCostBrl, { measuredAt, importId, contentId, id: `${importId}-${rowId}-cost` }),
    metric("promo:views", values.views, { measuredAt, importId, contentId, id: `${importId}-${rowId}-views` }),
    metric("promo:newFollowers", values.newFollowers, { measuredAt, importId, contentId, id: `${importId}-${rowId}-followers` }),
  ];
}

function importRow(id: string, startedAt: string): IntelligenceImportRecord {
  return {
    id,
    dataset_id: DATASET.id,
    status: "completed",
    file_name: "tiktok-promotions-history.csv",
    accepted_records: 1,
    rejected_records: 0,
    started_at: startedAt,
  };
}

describe("isCampaignMetric / isCampaignDataset", () => {
  it("reconhece as 3 chaves promo: e ignora chaves de outras plataformas", () => {
    expect(isCampaignMetric(campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1, views: 1, newFollowers: 1 })[0])).toBe(true);
    expect(
      isCampaignMetric({
        id: "m1",
        dataset_id: DATASET.id,
        import_id: "import-1",
        key: "followers",
        value: 10,
        measured_at: "2026-07-01T00:00:00.000Z",
        created_at: "2026-07-01T00:00:00.000Z",
      })
    ).toBe(false);
  });

  it("classifica um Dataset como Campaign independente da platform", () => {
    const metaAdsDataset: IntelligenceDatasetRecord = { ...DATASET, id: "dataset-2", platform: "meta_ads", name: "Meta Ads — Campanhas" };
    const metrics = campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 100, views: 1000, newFollowers: 10 });
    const rowsForMeta = metrics.map((m) => ({ ...m, dataset_id: metaAdsDataset.id }));

    expect(isCampaignDataset(metaAdsDataset, rowsForMeta)).toBe(true);
  });

  it("não classifica um Dataset sem nenhuma métrica promo: como Campaign", () => {
    const youtubeDataset: IntelligenceDatasetRecord = { ...DATASET, id: "dataset-3", platform: "youtube", name: "YouTube" };
    expect(isCampaignDataset(youtubeDataset, [])).toBe(false);
  });
});

describe("buildCampaignDatasetSummaries", () => {
  it("agrega gasto total, views pagas, seguidores adquiridos e calcula custo por seguidor/view", () => {
    const metrics = [
      ...campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 1200, views: 48000, newFollowers: 720 }),
      ...campaignRow("import-1", "2026-07-08T00:00:00.000Z", { adCostBrl: 800, views: 32000, newFollowers: 480 }),
    ];

    const [summary] = buildCampaignDatasetSummaries([DATASET], [], metrics, []);

    expect(summary).toMatchObject({
      datasetId: "dataset-1",
      datasetName: "TikTok — Promoções",
      platform: "tiktok",
      totalAdCostBrl: 2000,
      totalViews: 80000,
      totalNewFollowers: 1200,
    });
    expect(summary.costPerView).toBeCloseTo(2000 / 80000);
    expect(summary.costPerFollower).toBeCloseTo(2000 / 1200);
    expect(summary.entries).toHaveLength(2);
  });

  it("nunca persiste costPerView/costPerFollower — são sempre calculados a partir dos 3 fatos brutos", () => {
    const metrics = campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 500, views: 20000, newFollowers: 100 });
    const [summary] = buildCampaignDatasetSummaries([DATASET], [], metrics, []);

    expect(summary.entries[0].costPerView).toBeCloseTo(500 / 20000);
    expect(summary.entries[0].costPerFollower).toBeCloseTo(500 / 100);
    expect(metrics.map((m) => m.key)).not.toContain("promo:costPerView");
    expect(metrics.map((m) => m.key)).not.toContain("promo:costPerFollower");
  });

  it("retorna costPerView/costPerFollower nulos quando o denominador é 0, sem dividir por zero", () => {
    const metrics = campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 300, views: 0, newFollowers: 0 });
    const [summary] = buildCampaignDatasetSummaries([DATASET], [], metrics, []);

    expect(summary.entries[0].costPerView).toBeNull();
    expect(summary.entries[0].costPerFollower).toBeNull();
    expect(summary.costPerView).toBeNull();
    expect(summary.costPerFollower).toBeNull();
  });

  it("resolve o título do Content quando a linha identifica um vídeo promovido (Opção C)", () => {
    const content: IntelligenceContentRecord = {
      id: "content-1",
      dataset_id: DATASET.id,
      title: "Livros para sair da ressaca",
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    };
    const metrics = campaignRow(
      "import-1",
      "2026-07-01T00:00:00.000Z",
      { adCostBrl: 1200, views: 48000, newFollowers: 720 },
      "content-1"
    );

    const [summary] = buildCampaignDatasetSummaries([DATASET], [], metrics, [content]);

    expect(summary.entries[0].contentId).toBe("content-1");
    expect(summary.entries[0].title).toBe("Livros para sair da ressaca");
    expect(campaignEntryLabel(summary.entries[0])).toBe("Livros para sair da ressaca");
  });

  it("usa a data medida como rótulo quando a campanha é agregada, sem Content", () => {
    const metrics = campaignRow("import-1", "2026-07-01T00:00:00.000Z", { adCostBrl: 300, views: 5000, newFollowers: 50 });
    const [summary] = buildCampaignDatasetSummaries([DATASET], [], metrics, []);

    expect(summary.entries[0].contentId).toBeUndefined();
    expect(campaignEntryLabel(summary.entries[0])).toBe("Promoção de 2026-07-01");
  });

  it("deduplica a reimportação do mesmo período e mantém somente o Import mais recente", () => {
    const measuredAt = "2026-07-01T00:00:00.000Z";
    const imports = [
      importRow("import-old", "2026-08-01T10:00:00.000Z"),
      importRow("import-new", "2026-08-02T10:00:00.000Z"),
    ];
    const metrics = [
      ...campaignRow("import-old", measuredAt, { adCostBrl: 1200, views: 48000, newFollowers: 720 }),
      ...campaignRow("import-new", measuredAt, { adCostBrl: 1200, views: 48000, newFollowers: 720 }),
    ];

    const [summary] = buildCampaignDatasetSummaries([DATASET], imports, metrics, []);

    expect(summary.entries).toHaveLength(1);
    expect(summary).toMatchObject({
      totalAdCostBrl: 1200,
      totalViews: 48000,
      totalNewFollowers: 720,
    });
  });

  it("mantém o mesmo conteúdo em datas diferentes como CampaignEntries distintas", () => {
    const content: IntelligenceContentRecord = {
      id: "content-1",
      dataset_id: DATASET.id,
      title: "Livros para sair da ressaca",
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    };
    const metrics = [
      ...campaignRow(
        "import-1",
        "2026-07-01T00:00:00.000Z",
        { adCostBrl: 300, views: 10000, newFollowers: 100 },
        content.id
      ),
      ...campaignRow(
        "import-1",
        "2026-07-08T00:00:00.000Z",
        { adCostBrl: 500, views: 20000, newFollowers: 250 },
        content.id
      ),
    ];

    const [summary] = buildCampaignDatasetSummaries([DATASET], [], metrics, [content]);

    expect(summary.entries).toHaveLength(2);
    expect(summary.entries.map((entry) => entry.measuredAt)).toEqual([
      "2026-07-08T00:00:00.000Z",
      "2026-07-01T00:00:00.000Z",
    ]);
    expect(summary.totalAdCostBrl).toBe(800);
  });

  it("soma linhas repetidas no mesmo dia dentro do mesmo Import antes de calcular razões", () => {
    const measuredAt = "2026-07-01T00:00:00.000Z";
    const metrics = [
      ...campaignRow(
        "import-1",
        measuredAt,
        { adCostBrl: 300, views: 10000, newFollowers: 100 },
        undefined,
        "row-1"
      ),
      ...campaignRow(
        "import-1",
        measuredAt,
        { adCostBrl: 500, views: 20000, newFollowers: 250 },
        undefined,
        "row-2"
      ),
    ];

    const [summary] = buildCampaignDatasetSummaries(
      [DATASET],
      [importRow("import-1", "2026-08-01T10:00:00.000Z")],
      metrics,
      []
    );

    expect(summary.entries).toHaveLength(1);
    expect(summary.entries[0]).toMatchObject({
      adCostBrl: 800,
      views: 30000,
      newFollowers: 350,
    });
    expect(summary.entries[0].costPerView).toBeCloseTo(800 / 30000);
    expect(summary.entries[0].costPerFollower).toBeCloseTo(800 / 350);
  });

  it("retorna lista vazia quando não há nenhum Dataset Campaign-shaped", () => {
    expect(buildCampaignDatasetSummaries([], [], [], [])).toEqual([]);
  });
});
