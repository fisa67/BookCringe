import { beforeEach, describe, expect, it, vi } from "vitest";
import { tiktokPromotionsPersistence } from "@/lib/intelligence/imports/platforms/tiktok/persistence";
import type { TikTokPromotionNormalizedRecord } from "@/lib/intelligence/imports/platforms/tiktok/promotionsParser";
import type { ImportBatch } from "@/lib/intelligence/imports/types";

const {
  createImportMock,
  finalizeImportMock,
  findOrCreateDatasetMock,
  insertMetricsMock,
  upsertContentMock,
} = vi.hoisted(() => ({
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

const batch: ImportBatch = {
  id: "batch-1",
  platform: "tiktok",
  status: "detected",
  files: [{ id: "file-1", name: "tiktok-promotions-history.csv", size: 100, format: "csv" }],
  createdAt: "2026-08-04T12:00:00.000Z",
};

const OWNER_ID = "filipe-santos";

function record(title?: string): TikTokPromotionNormalizedRecord {
  return {
    platform: "tiktok",
    entityType: "campaign_metric",
    payload: {
      source: "tiktok_promotions",
      measuredAt: "2026-07-01T00:00:00.000Z",
      title,
      metrics: {
        "promo:adCostBrl": 1200.5,
        "promo:views": 48000,
        "promo:newFollowers": 720,
      },
    },
    source: { batchId: batch.id, fileId: "file-1", row: 2 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findOrCreateDatasetMock.mockResolvedValue({ id: "dataset-1" });
  createImportMock.mockResolvedValue({ id: "import-1" });
  finalizeImportMock.mockResolvedValue(true);
  insertMetricsMock.mockResolvedValue(true);
  upsertContentMock.mockResolvedValue({ id: "content-1" });
});

describe("tiktokPromotionsPersistence", () => {
  it("reutiliza Dataset/Import/Metric e não cria Content quando a promoção é agregada", async () => {
    const receipt = await tiktokPromotionsPersistence.persist([record()], batch, OWNER_ID);

    expect(findOrCreateDatasetMock).toHaveBeenCalledWith(OWNER_ID, {
      platform: "tiktok",
      name: "TikTok — Promoções",
    });
    expect(upsertContentMock).not.toHaveBeenCalled();
    expect(insertMetricsMock).toHaveBeenCalledWith([
      expect.objectContaining({ key: "promo:adCostBrl", value: 1200.5, unit: "BRL" }),
      expect.objectContaining({ key: "promo:views", value: 48000, unit: "count" }),
      expect.objectContaining({ key: "promo:newFollowers", value: 720, unit: "count" }),
    ]);
    const [rows] = insertMetricsMock.mock.calls[0];
    expect(rows.every((row: { content_id?: string }) => row.content_id === undefined)).toBe(true);
    expect(rows.map((row: { key: string }) => row.key)).not.toContain("costPerView");
    expect(rows.map((row: { key: string }) => row.key)).not.toContain("costPerFollower");
    expect(receipt).toMatchObject({ status: "persisted", acceptedRecords: 1, rejectedRecords: 0 });
  });

  it("associa as Metrics a Content quando a linha identifica um vídeo", async () => {
    await tiktokPromotionsPersistence.persist([record("Vídeo promovido")], batch, OWNER_ID);

    expect(upsertContentMock).toHaveBeenCalledWith({
      dataset_id: "dataset-1",
      title: "Vídeo promovido",
    });
    const [rows] = insertMetricsMock.mock.calls[0];
    expect(rows.every((row: { content_id?: string }) => row.content_id === "content-1")).toBe(true);
  });
});
