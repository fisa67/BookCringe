import { describe, expect, it } from "vitest";
import { buildIntelligenceDashboardData } from "@/lib/intelligence/dashboard/summary";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

function content(overrides: Partial<IntelligenceContentRecord>): IntelligenceContentRecord {
  return {
    id: "content-1",
    dataset_id: DATASET.id,
    title: "Como ler mais em 2026",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function metric(overrides: Partial<IntelligenceMetricRecord>): IntelligenceMetricRecord {
  return {
    id: "metric-1",
    dataset_id: DATASET.id,
    import_id: "import-1",
    key: "views",
    value: 0,
    measured_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function importRow(overrides: Partial<IntelligenceImportRecord>): IntelligenceImportRecord {
  return {
    id: "import-1",
    dataset_id: DATASET.id,
    status: "completed",
    file_name: "youtube-julho.csv",
    accepted_records: 2,
    rejected_records: 0,
    started_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const BOOK: CmsBookRecord = {
  id: "book-1",
  slug: "como-ler-mais",
  title: "Como Ler Mais em 2026",
  author: "Autor Exemplo",
  genres: [],
  metadata: {},
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

describe("buildIntelligenceDashboardData", () => {
  it("retorna um resumo zerado quando não há nenhum dado", () => {
    const result = buildIntelligenceDashboardData({ datasets: [], imports: [], contents: [], metrics: [], books: [] });

    expect(result.summary).toEqual({ datasetsCount: 0, importsCount: 0, contentsCount: 0, linkedBooksCount: 0 });
    expect(result.latestImport).toBeNull();
    expect(result.topContents).toEqual([]);
    expect(result.audience).toEqual([]);
    expect(result.correlations).toEqual({
      growth: null,
      engagement: null,
      acquisition: null,
      retention: null,
    });
    expect(result.platformDistribution).toEqual([]);
    expect(result.matchingRate).toEqual({ linked: 0, unlinked: 0, total: 0, rate: 0 });
  });

  it("calcula o resumo geral, incluindo livros distintos vinculados", () => {
    const contents = [
      content({ id: "content-1", book_id: "book-1" }),
      content({ id: "content-2", title: "Outro vídeo" }),
    ];

    const result = buildIntelligenceDashboardData({
      datasets: [DATASET],
      imports: [importRow({})],
      contents,
      metrics: [],
      books: [BOOK],
    });

    expect(result.summary).toEqual({ datasetsCount: 1, importsCount: 1, contentsCount: 2, linkedBooksCount: 1 });
  });

  it("identifica a última importação pelo started_at mais recente", () => {
    const older = importRow({ id: "import-1", started_at: "2026-07-01T00:00:00.000Z", file_name: "julho.csv" });
    const newer = importRow({ id: "import-2", started_at: "2026-08-01T00:00:00.000Z", file_name: "agosto.csv" });

    const result = buildIntelligenceDashboardData({
      datasets: [DATASET],
      imports: [older, newer],
      contents: [],
      metrics: [],
      books: [],
    });

    expect(result.latestImport).toMatchObject({ fileName: "agosto.csv", platform: "youtube" });
  });

  it("monta o Top de conteúdos usando a leitura mais recente de views por Content", () => {
    const contents = [
      content({ id: "content-1", title: "Vídeo A", book_id: "book-1" }),
      content({ id: "content-2", title: "Vídeo B" }),
      content({ id: "content-3", title: "Vídeo sem views" }),
    ];

    const metrics = [
      metric({ content_id: "content-1", key: "views", value: 100, measured_at: "2026-07-01T00:00:00.000Z" }),
      metric({ content_id: "content-1", key: "views", value: 500, measured_at: "2026-08-01T00:00:00.000Z" }),
      metric({ content_id: "content-2", key: "views", value: 900, measured_at: "2026-08-01T00:00:00.000Z" }),
      metric({ content_id: "content-2", key: "watch_time_hours", value: 40, measured_at: "2026-08-01T00:00:00.000Z" }),
    ];

    const result = buildIntelligenceDashboardData({
      datasets: [DATASET],
      imports: [],
      contents,
      metrics,
      books: [BOOK],
    });

    expect(result.topContents).toEqual([
      { contentId: "content-2", title: "Vídeo B", platform: "youtube", views: 900, bookTitle: undefined },
      { contentId: "content-1", title: "Vídeo A", platform: "youtube", views: 500, bookTitle: BOOK.title },
    ]);
  });

  it("respeita o limite do Top de conteúdos", () => {
    const contents = Array.from({ length: 15 }, (_, index) => content({ id: `content-${index}`, title: `Vídeo ${index}` }));
    const metrics = contents.map((c, index) =>
      metric({ content_id: c.id, key: "views", value: index + 1, measured_at: "2026-08-01T00:00:00.000Z" })
    );

    const result = buildIntelligenceDashboardData({ datasets: [DATASET], imports: [], contents, metrics, books: [] });

    expect(result.topContents).toHaveLength(10);
    expect(result.topContents[0]?.views).toBe(15);
  });

  it("calcula a distribuição por plataforma", () => {
    const otherDataset: IntelligenceDatasetRecord = { ...DATASET, id: "dataset-2", platform: "instagram" };
    const contents = [
      content({ id: "content-1", dataset_id: DATASET.id }),
      content({ id: "content-2", dataset_id: DATASET.id }),
      content({ id: "content-3", dataset_id: otherDataset.id }),
    ];

    const result = buildIntelligenceDashboardData({
      datasets: [DATASET, otherDataset],
      imports: [],
      contents,
      metrics: [],
      books: [],
    });

    expect(result.platformDistribution).toEqual([
      { platform: "youtube", contentsCount: 2, share: 2 / 3 },
      { platform: "instagram", contentsCount: 1, share: 1 / 3 },
    ]);
  });

  it("inclui os insights do Rules Engine, determinísticos via `now`", () => {
    const staleImport = importRow({ started_at: "2026-01-01T00:00:00.000Z" });

    const result = buildIntelligenceDashboardData({
      datasets: [DATASET],
      imports: [staleImport],
      contents: [],
      metrics: [],
      books: [],
      now: new Date("2026-08-01T00:00:00.000Z"),
    });

    const ruleIds = result.insights.map((insight) => insight.ruleId);
    expect(ruleIds).toContain("stale-dataset");
    expect(ruleIds).toContain("low-content-volume");
  });

  it("calcula a taxa de matching (vinculados x não vinculados)", () => {
    const contents = [
      content({ id: "content-1", book_id: "book-1" }),
      content({ id: "content-2" }),
      content({ id: "content-3" }),
    ];

    const result = buildIntelligenceDashboardData({ datasets: [DATASET], imports: [], contents, metrics: [], books: [BOOK] });

    expect(result.matchingRate).toEqual({ linked: 1, unlinked: 2, total: 3, rate: 1 / 3 });
  });

  it("resume métricas úteis de Datasets de audiência sem exigir Content", () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    const audienceMetric = (
      id: string,
      key: string,
      value: number,
      measuredAt = "2026-08-01T12:00:00.000Z"
    ): IntelligenceMetricRecord =>
      metric({
        id,
        dataset_id: audienceDataset.id,
        import_id: "instagram-import",
        content_id: undefined,
        key,
        value,
        measured_at: measuredAt,
      });
    const metrics = [
      audienceMetric("followers-old", "followers", 1200, "2026-07-31T00:00:00.000Z"),
      audienceMetric("followers-new", "followers", 1250),
      audienceMetric("growth", "followersDelta", 50),
      audienceMetric("activity-morning", "activeFollowers", 300, "2026-08-01T09:00:00.000Z"),
      audienceMetric("activity-evening", "activeFollowers", 780, "2026-08-01T20:00:00.000Z"),
      audienceMetric("gender-women", "gender:Mulheres", 0.68),
      audienceMetric("gender-men", "gender:Homens", 0.32),
      audienceMetric("territory-br", "territory:BR", 0.74),
      audienceMetric("territory-pt", "territory:PT", 0.11),
    ];

    const result = buildIntelligenceDashboardData({
      datasets: [audienceDataset],
      imports: [],
      contents: [],
      metrics,
      books: [],
    });

    expect(result.audience).toEqual([
      {
        datasetId: audienceDataset.id,
        datasetName: audienceDataset.name,
        platform: "instagram",
        followers: { value: 1250, measuredAt: "2026-08-01T12:00:00.000Z" },
        followerGrowth: { value: 50, measuredAt: "2026-08-01T12:00:00.000Z" },
        activityPeak: { value: 780, measuredAt: "2026-08-01T20:00:00.000Z" },
        genderDistribution: [
          { label: "Mulheres", value: 0.68 },
          { label: "Homens", value: 0.32 },
        ],
        territoryDistribution: [
          { label: "BR", value: 0.74 },
          { label: "PT", value: 0.11 },
        ],
      },
    ]);
    expect(result.topContents).toEqual([]);
    expect(result.matchingRate.total).toBe(0);
  });

  it("resume gasto total, views pagas, seguidores adquiridos e custo por seguidor de Datasets de campanha (Sprint 20.5)", () => {
    const campaignDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "tiktok-promotions",
      platform: "tiktok",
      name: "TikTok — Promoções",
    };
    const campaignMetric = (id: string, key: string, value: number): IntelligenceMetricRecord =>
      metric({
        id,
        dataset_id: campaignDataset.id,
        import_id: "tiktok-import",
        content_id: undefined,
        key,
        value,
        unit: key === "promo:adCostBrl" ? "BRL" : "count",
        measured_at: "2026-08-01T00:00:00.000Z",
      });
    const metrics = [
      campaignMetric("promo-cost", "promo:adCostBrl", 1200),
      campaignMetric("promo-views", "promo:views", 48000),
      campaignMetric("promo-followers", "promo:newFollowers", 720),
    ];

    const result = buildIntelligenceDashboardData({
      datasets: [campaignDataset],
      imports: [],
      contents: [],
      metrics,
      books: [],
    });

    expect(result.campaign).toEqual([
      {
        datasetId: campaignDataset.id,
        datasetName: campaignDataset.name,
        platform: "tiktok",
        totalAdCostBrl: 1200,
        totalViews: 48000,
        totalNewFollowers: 720,
        costPerView: 1200 / 48000,
        costPerFollower: 1200 / 720,
        entries: [
          {
            key: "[null,\"2026-08-01T00:00:00.000Z\"]",
            contentId: undefined,
            title: undefined,
            measuredAt: "2026-08-01T00:00:00.000Z",
            adCostBrl: 1200,
            views: 48000,
            newFollowers: 720,
            costPerView: 1200 / 48000,
            costPerFollower: 1200 / 720,
          },
        ],
      },
    ]);
  });

  it("expõe as quatro correlações existentes entre Content e Audience", () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    const contents = [
      content({ id: "content-1", title: "Vídeo A", book_id: BOOK.id }),
      content({ id: "content-2", title: "Vídeo B" }),
    ];
    const metrics = [
      metric({ id: "views-1", content_id: "content-1", key: "views", value: 1000 }),
      metric({ id: "watch-1", content_id: "content-1", key: "watchTimeHours", value: 60 }),
      metric({ id: "subs-1", content_id: "content-1", key: "subscribers", value: 30 }),
      metric({ id: "views-2", content_id: "content-2", key: "views", value: 3000 }),
      metric({ id: "watch-2", content_id: "content-2", key: "watchTimeHours", value: 10 }),
      metric({ id: "subs-2", content_id: "content-2", key: "subscribers", value: 5 }),
      metric({
        id: "audience-growth",
        dataset_id: audienceDataset.id,
        import_id: "instagram-import",
        content_id: undefined,
        key: "followersDelta",
        value: 80,
      }),
      metric({
        id: "audience-activity",
        dataset_id: audienceDataset.id,
        import_id: "instagram-import",
        content_id: undefined,
        key: "activeFollowers",
        value: 900,
      }),
    ];

    const result = buildIntelligenceDashboardData({
      datasets: [DATASET, audienceDataset],
      imports: [],
      contents,
      metrics,
      books: [BOOK],
    });

    expect(result.correlations.growth).toMatchObject({
      theme: BOOK.title,
      confidence: "high",
    });
    expect(result.correlations.engagement).toMatchObject({ confidence: "high" });
    expect(result.correlations.acquisition).toMatchObject({
      contentId: "content-1",
      confidence: "high",
    });
    expect(result.correlations.retention).toMatchObject({
      contentId: "content-1",
      confidence: "high",
    });
  });
});
