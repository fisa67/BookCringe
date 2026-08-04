import { describe, expect, it, vi } from "vitest";
import {
  getAudienceAnswers,
  getAudienceStrategyAnswers,
  getBestContentAnswer,
  getCampaignAnswers,
  getContentPerformanceAnswers,
  getStaleDatasetAnswer,
  getUnmatchedContentAnswer,
} from "./intelligenceQuestionsService";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";

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

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const CONTENT: IntelligenceContentRecord = {
  id: "content-1",
  dataset_id: DATASET.id,
  title: "Como ler mais em 2026",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const METRIC: IntelligenceMetricRecord = {
  id: "metric-1",
  dataset_id: DATASET.id,
  import_id: "import-1",
  content_id: CONTENT.id,
  key: "views",
  value: 15420,
  measured_at: "2026-08-01T00:00:00.000Z",
  created_at: "2026-08-01T00:00:00.000Z",
};

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

describe("getBestContentAnswer", () => {
  it("busca dados via os services existentes e delega a resposta para bestContentQuestion", async () => {
    listDatasetsMock.mockResolvedValue([DATASET]);
    listContentsMock.mockResolvedValue([CONTENT]);
    listMetricsMock.mockResolvedValue([METRIC]);
    getBooksMock.mockResolvedValue([BOOK]);

    const result = await getBestContentAnswer();

    expect(result.questionId).toBe("best-content");
    expect(result.hasAnswer).toBe(true);
    expect(result.data).toMatchObject({ contentId: "content-1", title: "Como ler mais em 2026", value: 15420 });
  });

  it("trata retorno null de qualquer service como lista vazia, sem lançar erro", async () => {
    listDatasetsMock.mockResolvedValue(null);
    listContentsMock.mockResolvedValue(null);
    listMetricsMock.mockResolvedValue(null);
    getBooksMock.mockResolvedValue(null);

    const result = await getBestContentAnswer();

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
  });
});

const IMPORT: IntelligenceImportRecord = {
  id: "import-1",
  dataset_id: DATASET.id,
  status: "completed",
  file_name: "youtube-julho.csv",
  accepted_records: 2,
  rejected_records: 0,
  started_at: "2026-06-01T00:00:00.000Z",
};

describe("getStaleDatasetAnswer", () => {
  it("busca Datasets e Imports e delega a resposta para staleDatasetQuestion", async () => {
    listDatasetsMock.mockResolvedValue([DATASET]);
    listImportsMock.mockResolvedValue([IMPORT]);

    const result = await getStaleDatasetAnswer();

    expect(result.questionId).toBe("stale-dataset");
    expect(result.hasAnswer).toBe(true);
    expect(result.data).toMatchObject({ datasetId: "dataset-1" });
  });

  it("trata retorno null como lista vazia", async () => {
    listDatasetsMock.mockResolvedValue(null);
    listImportsMock.mockResolvedValue(null);

    const result = await getStaleDatasetAnswer();

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
  });
});

describe("getUnmatchedContentAnswer", () => {
  it("busca Contents e delega a resposta para unmatchedContentQuestion", async () => {
    listContentsMock.mockResolvedValue([CONTENT]);

    const result = await getUnmatchedContentAnswer();

    expect(result.questionId).toBe("unmatched-content");
    expect(result.hasAnswer).toBe(true);
    expect(result.data).toEqual({ totalContents: 1, unmatchedContents: 1, unmatchedRatio: 1 });
  });

  it("trata retorno null como lista vazia", async () => {
    listContentsMock.mockResolvedValue(null);

    const result = await getUnmatchedContentAnswer();

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
  });
});

describe("getAudienceAnswers", () => {
  it("busca Dataset e Metrics uma vez e responde às quatro perguntas de audiência", async () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    const audienceMetrics: IntelligenceMetricRecord[] = [
      { ...METRIC, id: "followers", dataset_id: audienceDataset.id, content_id: undefined, key: "followers", value: 1800 },
      { ...METRIC, id: "growth", dataset_id: audienceDataset.id, content_id: undefined, key: "followersDelta", value: 42 },
      { ...METRIC, id: "activity", dataset_id: audienceDataset.id, content_id: undefined, key: "activeFollowers", value: 900 },
      { ...METRIC, id: "territory", dataset_id: audienceDataset.id, content_id: undefined, key: "territory:BR", value: 0.71 },
      { ...METRIC, id: "gender", dataset_id: audienceDataset.id, content_id: undefined, key: "gender:Mulheres", value: 0.64 },
    ];
    listDatasetsMock.mockResolvedValue([audienceDataset]);
    listMetricsMock.mockResolvedValue(audienceMetrics);

    const result = await getAudienceAnswers();

    expect(result.followerGrowth.data).toMatchObject({ growth: 42, followers: 1800 });
    expect(result.activityPeak.data).toMatchObject({ activeFollowers: 900 });
    expect(result.topTerritory.data).toMatchObject({ territory: "BR" });
    expect(result.primaryAudience.data).toMatchObject({ label: "Mulheres" });
  });
});

describe("getAudienceStrategyAnswers", () => {
  it("responde às quatro perguntas estratégicas de audiência", async () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    listDatasetsMock.mockResolvedValue([audienceDataset]);
    listContentsMock.mockResolvedValue([CONTENT]);
    listMetricsMock.mockResolvedValue([
      { ...METRIC, id: "g1", dataset_id: audienceDataset.id, content_id: undefined, key: "gender:Mulheres", value: 0.55, measured_at: "2026-07-01T00:00:00.000Z" },
      { ...METRIC, id: "g2", dataset_id: audienceDataset.id, content_id: undefined, key: "gender:Homens", value: 0.45, measured_at: "2026-07-01T00:00:00.000Z" },
      { ...METRIC, id: "g3", dataset_id: audienceDataset.id, content_id: undefined, key: "gender:Mulheres", value: 0.62, measured_at: "2026-08-01T00:00:00.000Z" },
      { ...METRIC, id: "g4", dataset_id: audienceDataset.id, content_id: undefined, key: "gender:Homens", value: 0.38, measured_at: "2026-08-01T00:00:00.000Z" },
      { ...METRIC, id: "t1", dataset_id: audienceDataset.id, content_id: undefined, key: "territory:BR", value: 0.7, measured_at: "2026-07-01T00:00:00.000Z" },
      { ...METRIC, id: "t2", dataset_id: audienceDataset.id, content_id: undefined, key: "territory:MX", value: 0.1, measured_at: "2026-07-01T00:00:00.000Z" },
      { ...METRIC, id: "t3", dataset_id: audienceDataset.id, content_id: undefined, key: "territory:BR", value: 0.6, measured_at: "2026-08-01T00:00:00.000Z" },
      { ...METRIC, id: "t4", dataset_id: audienceDataset.id, content_id: undefined, key: "territory:MX", value: 0.25, measured_at: "2026-08-01T00:00:00.000Z" },
    ]);

    const result = await getAudienceStrategyAnswers();

    expect(result.fastestGrowingSegment.data).toMatchObject({ segment: "Mulheres", confidence: "high" });
    expect(result.underservedSegment.data).toMatchObject({ segment: "Homens" });
    expect(result.territoryGrowthOpportunity.data).toMatchObject({ territory: "MX", confidence: "high" });
    expect(result.audienceContentMismatch.hasAnswer).toBe(true);
  });
});

describe("getContentPerformanceAnswers", () => {
  it("responde às quatro perguntas de content performance", async () => {
    const audienceDataset: IntelligenceDatasetRecord = {
      ...DATASET,
      id: "instagram-audience",
      platform: "instagram",
      name: "Instagram — Audiência",
    };
    listDatasetsMock.mockResolvedValue([DATASET, audienceDataset]);
    listContentsMock.mockResolvedValue([CONTENT, { ...CONTENT, id: "content-2", title: "Outro" }]);
    listMetricsMock.mockResolvedValue([
      { ...METRIC, id: "v1", content_id: CONTENT.id, key: "views", value: 1000 },
      { ...METRIC, id: "w1", content_id: CONTENT.id, key: "watchTimeHours", value: 40 },
      { ...METRIC, id: "s1", content_id: CONTENT.id, key: "subscribers", value: 20 },
      { ...METRIC, id: "v2", content_id: "content-2", key: "views", value: 3000 },
      { ...METRIC, id: "w2", content_id: "content-2", key: "watchTimeHours", value: 5 },
      { ...METRIC, id: "s2", content_id: "content-2", key: "subscribers", value: 4 },
      {
        ...METRIC,
        id: "growth",
        dataset_id: audienceDataset.id,
        content_id: undefined,
        key: "followersDelta",
        value: 55,
      },
      {
        ...METRIC,
        id: "activity",
        dataset_id: audienceDataset.id,
        content_id: undefined,
        key: "activeFollowers",
        value: 700,
      },
    ]);
    getBooksMock.mockResolvedValue([BOOK]);

    const result = await getContentPerformanceAnswers();

    expect(result.growthTheme.hasAnswer).toBe(true);
    expect(result.engagementFormat.hasAnswer).toBe(true);
    expect(result.audienceAcquisitionContent.hasAnswer).toBe(true);
    expect(result.retentionContent.hasAnswer).toBe(true);
  });
});

describe("getCampaignAnswers", () => {
  it("busca Dataset e Metrics de campanha e responde às três perguntas mínimas (Sprint 20.5)", async () => {
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
      campaignMetric("cost-1", "promo:adCostBrl", 1200, "import-1", "2026-07-01T00:00:00.000Z"),
      campaignMetric("views-1", "promo:views", 48000, "import-1", "2026-07-01T00:00:00.000Z"),
      campaignMetric("followers-1", "promo:newFollowers", 720, "import-1", "2026-07-01T00:00:00.000Z"),
      campaignMetric("cost-2", "promo:adCostBrl", 800, "import-2", "2026-07-08T00:00:00.000Z"),
      campaignMetric("views-2", "promo:views", 16000, "import-2", "2026-07-08T00:00:00.000Z"),
      campaignMetric("followers-2", "promo:newFollowers", 200, "import-2", "2026-07-08T00:00:00.000Z"),
    ]);

    const result = await getCampaignAnswers();

    expect(result.bestCampaign.hasAnswer).toBe(true);
    expect(result.lowestCostPerFollower.hasAnswer).toBe(true);
    expect(result.highestAcquisition.data).toMatchObject({ newFollowers: 720 });
  });

  it("trata retorno null de qualquer service como lista vazia, sem lançar erro", async () => {
    listDatasetsMock.mockResolvedValue(null);
    listImportsMock.mockResolvedValue(null);
    listContentsMock.mockResolvedValue(null);
    listMetricsMock.mockResolvedValue(null);

    const result = await getCampaignAnswers();

    expect(result.bestCampaign.hasAnswer).toBe(false);
    expect(result.lowestCostPerFollower.hasAnswer).toBe(false);
    expect(result.highestAcquisition.hasAnswer).toBe(false);
  });
});
