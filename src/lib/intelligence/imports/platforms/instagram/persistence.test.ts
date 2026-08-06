import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImportBatch } from "@/lib/intelligence/imports/types";
import type { InstagramAudienceNormalizedRecord } from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";
import { instagramAudiencePersistence } from "@/lib/intelligence/imports/platforms/instagram/persistence";

const { createImportMock, finalizeImportMock, findOrCreateDatasetMock, insertMetricsMock } = vi.hoisted(() => ({
  createImportMock: vi.fn(),
  finalizeImportMock: vi.fn(),
  findOrCreateDatasetMock: vi.fn(),
  insertMetricsMock: vi.fn(),
}));

vi.mock("@/lib/services/intelligenceDatasetService", () => ({
  createImport: createImportMock,
  finalizeImport: finalizeImportMock,
  findOrCreateDataset: findOrCreateDatasetMock,
  insertMetrics: insertMetricsMock,
}));

const BATCH: ImportBatch = {
  id: "batch-1",
  platform: "instagram",
  status: "detected",
  files: [{ id: "file-1", name: "FollowerHistory.xlsx", size: 4200, format: "excel" }],
  createdAt: "2026-08-03T12:00:00.000Z",
};

const OWNER_ID = "filipe-santos";

const DATASET_ROW = {
  id: "dataset-1",
  platform: "instagram" as const,
  name: "Instagram — Audiência",
  created_at: "2026-08-03T00:00:00.000Z",
  updated_at: "2026-08-03T00:00:00.000Z",
};

const IMPORT_ROW = {
  id: "import-1",
  dataset_id: "dataset-1",
  status: "processing" as const,
  file_name: "FollowerHistory.xlsx",
  accepted_records: 0,
  rejected_records: 0,
  started_at: "2026-08-03T00:00:00.000Z",
};

function historyRecord(date: string, followers: number, followersDelta: number): InstagramAudienceNormalizedRecord {
  return {
    platform: "instagram",
    entityType: "audience_metric",
    payload: { datasetKind: "audience_history", date, followers, followersDelta },
    source: { batchId: BATCH.id, fileId: "file-1", row: 2 },
  };
}

function activityRecord(date: string, hour: number, activeFollowers: number): InstagramAudienceNormalizedRecord {
  return {
    platform: "instagram",
    entityType: "audience_metric",
    payload: { datasetKind: "audience_activity", date, hour, activeFollowers },
    source: { batchId: BATCH.id, fileId: "file-1", row: 2 },
  };
}

function demographicsRecord(label: string, distribution: number): InstagramAudienceNormalizedRecord {
  return {
    platform: "instagram",
    entityType: "audience_metric",
    payload: { datasetKind: "audience_demographics", label, distribution },
    source: { batchId: BATCH.id, fileId: "file-1", row: 2 },
  };
}

function territoryRecord(territory: string, distribution: number): InstagramAudienceNormalizedRecord {
  return {
    platform: "instagram",
    entityType: "audience_metric",
    payload: { datasetKind: "audience_territories", territory, distribution },
    source: { batchId: BATCH.id, fileId: "file-1", row: 2 },
  };
}

beforeEach(() => {
  createImportMock.mockReset();
  finalizeImportMock.mockReset();
  findOrCreateDatasetMock.mockReset();
  insertMetricsMock.mockReset();

  findOrCreateDatasetMock.mockResolvedValue(DATASET_ROW);
  createImportMock.mockResolvedValue(IMPORT_ROW);
  finalizeImportMock.mockResolvedValue(true);
  insertMetricsMock.mockResolvedValue(true);
});

describe("instagramAudiencePersistence.persist", () => {
  it("retorna falha sem chamar o banco quando não há registros", async () => {
    const receipt = await instagramAudiencePersistence.persist([], BATCH, OWNER_ID);

    expect(receipt).toMatchObject({ status: "failed", acceptedRecords: 0, rejectedRecords: 0 });
    expect(findOrCreateDatasetMock).not.toHaveBeenCalled();
  });

  it("encontra/cria um único Dataset 'Instagram — Audiência' (sem depender de datasetKind)", async () => {
    const records = [historyRecord("2026-07-25", 1000, 10), historyRecord("2026-07-26", 1015, 15)];
    await instagramAudiencePersistence.persist(records, BATCH, OWNER_ID);

    expect(findOrCreateDatasetMock).toHaveBeenCalledTimes(1);
    expect(findOrCreateDatasetMock).toHaveBeenCalledWith(OWNER_ID, {
      platform: "instagram",
      name: "Instagram — Audiência",
    });
    expect(createImportMock).toHaveBeenCalledWith({ dataset_id: "dataset-1", file_name: "FollowerHistory.xlsx" });
  });

  it("nunca chama upsertContent — persiste FollowerHistory como Metric sem Content", async () => {
    const records = [historyRecord("2026-07-25", 1000, 10)];
    const receipt = await instagramAudiencePersistence.persist(records, BATCH, OWNER_ID);

    expect(insertMetricsMock).toHaveBeenCalledTimes(1);
    expect(insertMetricsMock).toHaveBeenCalledWith([
      expect.objectContaining({
        dataset_id: "dataset-1",
        import_id: "import-1",
        key: "followers",
        value: 1000,
        unit: "count",
        measured_at: "2026-07-25T00:00:00.000Z",
      }),
      expect.objectContaining({
        dataset_id: "dataset-1",
        import_id: "import-1",
        key: "followersDelta",
        value: 10,
        unit: "count",
        measured_at: "2026-07-25T00:00:00.000Z",
      }),
    ]);
    // Nenhuma das linhas de Metric carrega content_id.
    const [rows] = insertMetricsMock.mock.calls[0];
    expect(rows.every((row: { content_id?: string }) => row.content_id === undefined)).toBe(true);

    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-1",
      status: "completed",
      acceptedRecords: 1,
      rejectedRecords: 0,
    });
    expect(receipt).toEqual({
      batchId: BATCH.id,
      status: "persisted",
      acceptedRecords: 1,
      rejectedRecords: 0,
      issues: [],
    });
  });

  it("persiste FollowerActivity combinando data + hora em measured_at", async () => {
    const records = [activityRecord("2026-07-25", 14, 320)];
    await instagramAudiencePersistence.persist(records, BATCH, OWNER_ID);

    expect(insertMetricsMock).toHaveBeenCalledWith([
      expect.objectContaining({
        key: "activeFollowers",
        value: 320,
        unit: "count",
        measured_at: "2026-07-25T14:00:00.000Z",
      }),
    ]);
  });

  it("persiste FollowerGender com a categoria embutida na key e measured_at do Import (batch.createdAt)", async () => {
    const records = [demographicsRecord("Male", 0.62), demographicsRecord("Female", 0.38)];
    await instagramAudiencePersistence.persist(records, BATCH, OWNER_ID);

    expect(insertMetricsMock).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ key: "gender:Male", value: 0.62, unit: "ratio", measured_at: BATCH.createdAt }),
    ]);
    expect(insertMetricsMock).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ key: "gender:Female", value: 0.38, unit: "ratio", measured_at: BATCH.createdAt }),
    ]);
  });

  it("persiste FollowerTopTerritories com a categoria embutida na key", async () => {
    const records = [territoryRecord("BR", 0.71), territoryRecord("Others", 0.05)];
    const receipt = await instagramAudiencePersistence.persist(records, BATCH, OWNER_ID);

    expect(insertMetricsMock).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ key: "territory:BR", value: 0.71, unit: "ratio" }),
    ]);
    expect(insertMetricsMock).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ key: "territory:Others", value: 0.05, unit: "ratio" }),
    ]);
    expect(receipt.acceptedRecords).toBe(2);
  });

  it("marca como falha quando o Dataset não pode ser encontrado/criado", async () => {
    findOrCreateDatasetMock.mockResolvedValue(null);

    const receipt = await instagramAudiencePersistence.persist([historyRecord("2026-07-25", 1000, 10)], BATCH, OWNER_ID);

    expect(receipt.status).toBe("failed");
    expect(createImportMock).not.toHaveBeenCalled();
  });

  it("marca como falha quando o Import não pode ser criado", async () => {
    createImportMock.mockResolvedValue(null);

    const receipt = await instagramAudiencePersistence.persist([historyRecord("2026-07-25", 1000, 10)], BATCH, OWNER_ID);

    expect(receipt.status).toBe("failed");
    expect(insertMetricsMock).not.toHaveBeenCalled();
  });

  it("conta registros individuais que falham como rejeitados, sem interromper os demais", async () => {
    insertMetricsMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const records = [historyRecord("2026-07-25", 1000, 10), historyRecord("2026-07-26", 1015, 15)];
    const receipt = await instagramAudiencePersistence.persist(records, BATCH, OWNER_ID);

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
    insertMetricsMock.mockResolvedValue(false);

    const receipt = await instagramAudiencePersistence.persist([historyRecord("2026-07-25", 1000, 10)], BATCH, OWNER_ID);

    expect(receipt.status).toBe("failed");
    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-1",
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 1,
    });
  });
});
