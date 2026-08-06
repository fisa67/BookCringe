import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImportBatch } from "@/lib/intelligence/imports/types";
import type { YouTubeNormalizedRecord } from "@/lib/intelligence/imports/platforms/youtube/parser";
import { youtubeStudioPersistence } from "@/lib/intelligence/imports/platforms/youtube/persistence";

const { createImportMock, finalizeImportMock, findOrCreateDatasetMock, insertMetricsMock, upsertContentMock } =
  vi.hoisted(() => ({
    createImportMock: vi.fn(),
    finalizeImportMock: vi.fn(),
    findOrCreateDatasetMock: vi.fn(),
    insertMetricsMock: vi.fn(),
    upsertContentMock: vi.fn(),
  }));

vi.mock("@/lib/services/intelligenceDatasetService", () => ({
  createImport: createImportMock,
  finalizeImport: finalizeImportMock,
  findOrCreateDataset: findOrCreateDatasetMock,
  insertMetrics: insertMetricsMock,
  upsertContent: upsertContentMock,
}));

const BATCH: ImportBatch = {
  id: "batch-1",
  platform: "youtube",
  status: "detected",
  files: [{ id: "file-1", name: "youtube-julho.csv", size: 1200, format: "csv" }],
  createdAt: "2026-08-01T00:00:00.000Z",
};

const OWNER_ID = "filipe-santos";

function buildRecord(title: string): YouTubeNormalizedRecord {
  return {
    platform: "youtube",
    entityType: "platform_metric",
    payload: {
      source: "youtube_studio",
      title,
      publishedAt: "2026-01-02",
      metrics: { views: 100, watchTimeHours: 5, impressions: 300, subscribers: 2 },
    },
    source: { batchId: BATCH.id, fileId: "file-1", row: 2 },
  };
}

const DATASET_ROW = {
  id: "dataset-1",
  platform: "youtube" as const,
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const IMPORT_ROW = {
  id: "import-1",
  dataset_id: "dataset-1",
  status: "processing" as const,
  file_name: "youtube-julho.csv",
  accepted_records: 0,
  rejected_records: 0,
  started_at: "2026-08-01T00:00:00.000Z",
};

beforeEach(() => {
  createImportMock.mockReset();
  finalizeImportMock.mockReset();
  findOrCreateDatasetMock.mockReset();
  insertMetricsMock.mockReset();
  upsertContentMock.mockReset();

  findOrCreateDatasetMock.mockResolvedValue(DATASET_ROW);
  createImportMock.mockResolvedValue(IMPORT_ROW);
  finalizeImportMock.mockResolvedValue(true);
  insertMetricsMock.mockResolvedValue(true);
});

describe("youtubeStudioPersistence.persist", () => {
  it("retorna falha sem chamar o banco quando não há registros", async () => {
    const receipt = await youtubeStudioPersistence.persist([], BATCH, OWNER_ID);

    expect(receipt).toMatchObject({ status: "failed", acceptedRecords: 0, rejectedRecords: 0 });
    expect(findOrCreateDatasetMock).not.toHaveBeenCalled();
  });

  it("encontra/cria o Dataset do dono, cria o Import e persiste Content + Metrics de cada registro", async () => {
    upsertContentMock.mockResolvedValue({ id: "content-1", dataset_id: "dataset-1", title: "Vídeo 1" });

    const records = [buildRecord("Vídeo 1"), buildRecord("Vídeo 2")];
    const receipt = await youtubeStudioPersistence.persist(records, BATCH, OWNER_ID);

    expect(findOrCreateDatasetMock).toHaveBeenCalledWith(OWNER_ID, {
      platform: "youtube",
      name: "YouTube Studio — Desempenho de vídeos",
    });
    expect(createImportMock).toHaveBeenCalledWith({ dataset_id: "dataset-1", file_name: "youtube-julho.csv" });
    expect(upsertContentMock).toHaveBeenCalledTimes(2);
    expect(insertMetricsMock).toHaveBeenCalledTimes(2);
    expect(insertMetricsMock).toHaveBeenCalledWith([
      expect.objectContaining({ dataset_id: "dataset-1", import_id: "import-1", content_id: "content-1", key: "views", value: 100 }),
      expect.objectContaining({ key: "watchTimeHours", value: 5 }),
      expect.objectContaining({ key: "impressions", value: 300 }),
      expect.objectContaining({ key: "subscribers", value: 2 }),
    ]);
    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-1",
      status: "completed",
      acceptedRecords: 2,
      rejectedRecords: 0,
    });
    expect(receipt).toEqual({
      batchId: BATCH.id,
      status: "persisted",
      acceptedRecords: 2,
      rejectedRecords: 0,
      issues: [],
    });
  });

  it("marca como falha quando o Dataset não pode ser encontrado/criado", async () => {
    findOrCreateDatasetMock.mockResolvedValue(null);

    const receipt = await youtubeStudioPersistence.persist([buildRecord("Vídeo 1")], BATCH, OWNER_ID);

    expect(receipt.status).toBe("failed");
    expect(createImportMock).not.toHaveBeenCalled();
  });

  it("marca como falha quando o Import não pode ser criado", async () => {
    createImportMock.mockResolvedValue(null);

    const receipt = await youtubeStudioPersistence.persist([buildRecord("Vídeo 1")], BATCH, OWNER_ID);

    expect(receipt.status).toBe("failed");
    expect(upsertContentMock).not.toHaveBeenCalled();
  });

  it("conta registros individuais que falham como rejeitados, sem interromper os demais", async () => {
    upsertContentMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "content-2", dataset_id: "dataset-1", title: "Vídeo 2" });

    const receipt = await youtubeStudioPersistence.persist(
      [buildRecord("Vídeo 1"), buildRecord("Vídeo 2")],
      BATCH,
      OWNER_ID
    );

    expect(receipt.acceptedRecords).toBe(1);
    expect(receipt.rejectedRecords).toBe(1);
    expect(receipt.status).toBe("persisted");
    expect(receipt.issues).toHaveLength(1);
    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-1",
      status: "completed",
      acceptedRecords: 1,
      rejectedRecords: 1,
    });
  });

  it("marca o Import como falho quando nenhum registro é aceito", async () => {
    upsertContentMock.mockResolvedValue(null);

    const receipt = await youtubeStudioPersistence.persist([buildRecord("Vídeo 1")], BATCH, OWNER_ID);

    expect(receipt.status).toBe("failed");
    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-1",
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 1,
    });
  });
});
