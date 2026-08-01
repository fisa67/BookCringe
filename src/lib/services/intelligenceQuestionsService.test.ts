import { describe, expect, it, vi } from "vitest";
import { getBestContentAnswer, getStaleDatasetAnswer, getUnmatchedContentAnswer } from "./intelligenceQuestionsService";
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
