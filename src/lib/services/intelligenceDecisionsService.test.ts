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

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
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

    const decisions = await getRecommendedDecisions();

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

    const decisions = await getRecommendedDecisions();

    expect(decisions).toEqual([]);
  });
});
