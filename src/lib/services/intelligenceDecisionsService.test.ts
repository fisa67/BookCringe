import { describe, expect, it, vi } from "vitest";
import { getRecommendedDecisions } from "./intelligenceDecisionsService";
import { STALE_DATASET_THRESHOLD_DAYS } from "@/lib/intelligence/insights";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const { listDatasetsMock, listContentsMock, listMetricsMock, listImportsMock, getBooksMock } = vi.hoisted(() => ({
  listDatasetsMock: vi.fn(),
  listContentsMock: vi.fn(),
  listMetricsMock: vi.fn(),
  listImportsMock: vi.fn(),
  getBooksMock: vi.fn(),
}));

vi.mock("@/lib/services/intelligenceDatasetService", () => ({
  listDatasets: listDatasetsMock,
  listContents: listContentsMock,
  listMetrics: listMetricsMock,
  listImports: listImportsMock,
}));

vi.mock("@/lib/services/bookService", () => ({
  getBooks: getBooksMock,
}));

const OWNER_ID = "filipe-santos";

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  owner_id: OWNER_ID,
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const CONTENT_LINKED: IntelligenceContentRecord = {
  id: "content-1",
  dataset_id: DATASET.id,
  title: "Como ler mais em 2026",
  book_id: "book-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const CONTENT_UNLINKED: IntelligenceContentRecord = {
  id: "content-2",
  dataset_id: DATASET.id,
  title: "Outro vídeo",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const METRIC: IntelligenceMetricRecord = {
  id: "metric-1",
  dataset_id: DATASET.id,
  import_id: "import-1",
  content_id: CONTENT_LINKED.id,
  key: "views",
  value: 15420,
  measured_at: "2026-01-01T00:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
};

function staleImport(daysAgo: number): IntelligenceImportRecord {
  const startedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: "import-1",
    dataset_id: DATASET.id,
    status: "completed",
    file_name: "relatorio.csv",
    accepted_records: 2,
    rejected_records: 0,
    started_at: startedAt,
  };
}

describe("getRecommendedDecisions", () => {
  it("busca dados via os services existentes e devolve as decisões calculadas", async () => {
    listDatasetsMock.mockResolvedValue([DATASET]);
    listImportsMock.mockResolvedValue([staleImport(STALE_DATASET_THRESHOLD_DAYS)]);
    listContentsMock.mockResolvedValue([CONTENT_LINKED, CONTENT_UNLINKED]);
    listMetricsMock.mockResolvedValue([METRIC]);
    getBooksMock.mockResolvedValue([{ id: "book-1", slug: "livro", title: "Livro", author: "Autor", genres: [], metadata: {}, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }]);

    const decisions = await getRecommendedDecisions(OWNER_ID);

    expect(decisions.map((decision) => decision.id)).toEqual(
      expect.arrayContaining(["repeat-best-theme", "import-stale-dataset"])
    );
  });

  it("trata retorno null de qualquer service como lista vazia, sem lançar erro e sem gerar decisões", async () => {
    listDatasetsMock.mockResolvedValue(null);
    listImportsMock.mockResolvedValue(null);
    listContentsMock.mockResolvedValue(null);
    listMetricsMock.mockResolvedValue(null);
    getBooksMock.mockResolvedValue(null);

    const decisions = await getRecommendedDecisions(OWNER_ID);

    expect(decisions).toEqual([]);
  });

  it("deriva decisões das novas Questions de Audience", async () => {
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
      measuredAt = "2026-08-03T12:00:00.000Z"
    ): IntelligenceMetricRecord => ({
      ...METRIC,
      id,
      dataset_id: audienceDataset.id,
      import_id: "instagram-import",
      content_id: undefined,
      key,
      value,
      measured_at: measuredAt,
    });
    listDatasetsMock.mockResolvedValue([audienceDataset]);
    listImportsMock.mockResolvedValue([]);
    listContentsMock.mockResolvedValue([]);
    listMetricsMock.mockResolvedValue([
      audienceMetric("followers", "followers", 1800),
      audienceMetric("growth", "followersDelta", -12),
      audienceMetric("activity", "activeFollowers", 920, "2026-08-03T20:00:00.000Z"),
      audienceMetric("territory", "territory:BR", 0.71),
      audienceMetric("gender", "gender:Mulheres", 0.64),
    ]);
    getBooksMock.mockResolvedValue([]);

    const decisions = await getRecommendedDecisions(OWNER_ID);

    expect(decisions.map((decision) => decision.id)).toEqual(
      expect.arrayContaining([
        "respond-to-follower-growth",
        "publish-at-activity-peak",
        "focus-top-audience-territory",
        "serve-primary-audience",
      ])
    );
  });

  it("deriva decisões das Questions estratégicas de Audience", async () => {
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
      measuredAt: string
    ): IntelligenceMetricRecord => ({
      ...METRIC,
      id,
      dataset_id: audienceDataset.id,
      import_id: "instagram-import",
      content_id: undefined,
      key,
      value,
      measured_at: measuredAt,
    });
    listDatasetsMock.mockResolvedValue([audienceDataset]);
    listImportsMock.mockResolvedValue([]);
    listContentsMock.mockResolvedValue([CONTENT_UNLINKED, { ...CONTENT_UNLINKED, id: "content-3" }, CONTENT_LINKED]);
    listMetricsMock.mockResolvedValue([
      audienceMetric("g1", "gender:Mulheres", 0.55, "2026-07-01T00:00:00.000Z"),
      audienceMetric("g2", "gender:Homens", 0.45, "2026-07-01T00:00:00.000Z"),
      audienceMetric("g3", "gender:Mulheres", 0.72, "2026-08-01T00:00:00.000Z"),
      audienceMetric("g4", "gender:Homens", 0.28, "2026-08-01T00:00:00.000Z"),
      audienceMetric("t1", "territory:BR", 0.7, "2026-07-01T00:00:00.000Z"),
      audienceMetric("t2", "territory:MX", 0.1, "2026-07-01T00:00:00.000Z"),
      audienceMetric("t3", "territory:BR", 0.6, "2026-08-01T00:00:00.000Z"),
      audienceMetric("t4", "territory:MX", 0.25, "2026-08-01T00:00:00.000Z"),
    ]);
    getBooksMock.mockResolvedValue([]);

    const decisions = await getRecommendedDecisions(OWNER_ID);

    expect(decisions.map((decision) => decision.id)).toEqual(
      expect.arrayContaining([
        "increase-focus-on-growing-segment",
        "test-format-for-underserved-segment",
        "explore-growing-territory",
        "rebalance-publishing-strategy",
      ])
    );
  });

  it("deriva decisões das Questions de Content Performance", async () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    listDatasetsMock.mockResolvedValue([DATASET, audienceDataset]);
    listImportsMock.mockResolvedValue([]);
    listContentsMock.mockResolvedValue([CONTENT_LINKED, CONTENT_UNLINKED]);
    listMetricsMock.mockResolvedValue([
      { ...METRIC, id: "v1", content_id: CONTENT_LINKED.id, key: "views", value: 1000 },
      { ...METRIC, id: "w1", content_id: CONTENT_LINKED.id, key: "watchTimeHours", value: 40 },
      { ...METRIC, id: "s1", content_id: CONTENT_LINKED.id, key: "subscribers", value: 25 },
      { ...METRIC, id: "v2", content_id: CONTENT_UNLINKED.id, key: "views", value: 3000 },
      { ...METRIC, id: "w2", content_id: CONTENT_UNLINKED.id, key: "watchTimeHours", value: 5 },
      { ...METRIC, id: "s2", content_id: CONTENT_UNLINKED.id, key: "subscribers", value: 4 },
      {
        ...METRIC,
        id: "growth",
        dataset_id: audienceDataset.id,
        content_id: undefined,
        key: "followersDelta",
        value: 80,
      },
      {
        ...METRIC,
        id: "activity",
        dataset_id: audienceDataset.id,
        content_id: undefined,
        key: "activeFollowers",
        value: 900,
      },
    ]);
    getBooksMock.mockResolvedValue([
      {
        id: "book-1",
        slug: "livro",
        title: "Livro",
        author: "Autor",
        genres: [],
        metadata: {},
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const decisions = await getRecommendedDecisions(OWNER_ID);

    expect(decisions.map((decision) => decision.id)).toEqual(
      expect.arrayContaining([
        "increase-high-growth-themes",
        "prioritize-high-engagement-formats",
        "expand-audience-acquisition-content",
        "reinforce-retention-focused-content",
      ])
    );
  });

  it("deriva decisão de Campaign a partir de promo:adCostBrl/promo:views/promo:newFollowers reais (Sprint 20.5)", async () => {
    const campaignDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "tiktok-promotions",
      platform: "tiktok",
      name: "TikTok — Promoções",
    };
    const campaignMetric = (
      id: string,
      key: string,
      value: number,
      importId: string,
      measuredAt: string
    ): IntelligenceMetricRecord => ({
      ...METRIC,
      id,
      dataset_id: campaignDataset.id,
      import_id: importId,
      content_id: undefined,
      key,
      value,
      measured_at: measuredAt,
      created_at: measuredAt,
    });
    listDatasetsMock.mockResolvedValue([campaignDataset]);
    listImportsMock.mockResolvedValue([]);
    listContentsMock.mockResolvedValue([]);
    listMetricsMock.mockResolvedValue([
      campaignMetric("promo-cost-1", "promo:adCostBrl", 1200, "import-1", "2026-07-01T00:00:00.000Z"),
      campaignMetric("promo-views-1", "promo:views", 48000, "import-1", "2026-07-01T00:00:00.000Z"),
      campaignMetric("promo-followers-1", "promo:newFollowers", 720, "import-1", "2026-07-01T00:00:00.000Z"),
      campaignMetric("promo-cost-2", "promo:adCostBrl", 800, "import-2", "2026-07-08T00:00:00.000Z"),
      campaignMetric("promo-views-2", "promo:views", 16000, "import-2", "2026-07-08T00:00:00.000Z"),
      campaignMetric("promo-followers-2", "promo:newFollowers", 80, "import-2", "2026-07-08T00:00:00.000Z"),
    ]);
    getBooksMock.mockResolvedValue([]);

    const decisions = await getRecommendedDecisions(OWNER_ID);

    expect(decisions.map((decision) => decision.id)).toEqual(expect.arrayContaining(["reallocate-campaign-budget"]));
    const decision = decisions.find((d) => d.id === "reallocate-campaign-budget");
    expect(decision?.description).toContain("R$");
  });
});
