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
});
