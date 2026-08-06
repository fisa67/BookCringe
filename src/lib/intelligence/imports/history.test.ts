import { describe, expect, it } from "vitest";
import { buildImportHistoryRows } from "@/lib/intelligence/imports/history";
import type { IntelligenceDatasetRecord, IntelligenceImportRecord } from "@/lib/types/intelligence";

const DATASET_YOUTUBE: IntelligenceDatasetRecord = {
  id: "dataset-youtube",
  platform: "youtube",
  name: "YouTube Studio",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const DATASET_TIKTOK: IntelligenceDatasetRecord = {
  id: "dataset-tiktok",
  platform: "tiktok",
  name: "TikTok — Promoções",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const IMPORT_YOUTUBE: IntelligenceImportRecord = {
  id: "import-1",
  dataset_id: DATASET_YOUTUBE.id,
  status: "completed",
  file_name: "youtube-studio-report.csv",
  accepted_records: 12,
  rejected_records: 0,
  started_at: "2026-08-01T10:00:00.000Z",
  finished_at: "2026-08-01T10:01:00.000Z",
};

const IMPORT_TIKTOK: IntelligenceImportRecord = {
  id: "import-2",
  dataset_id: DATASET_TIKTOK.id,
  status: "completed",
  file_name: "tiktok-promotions-history.csv",
  accepted_records: 5,
  rejected_records: 1,
  started_at: "2026-08-02T10:00:00.000Z",
  finished_at: "2026-08-02T10:01:00.000Z",
};

describe("buildImportHistoryRows", () => {
  it("resolve a plataforma pelo Dataset e preserva os campos do Import", () => {
    const rows = buildImportHistoryRows([IMPORT_YOUTUBE, IMPORT_TIKTOK], [DATASET_YOUTUBE, DATASET_TIKTOK]);

    expect(rows).toEqual([
      {
        id: "import-1",
        platform: "youtube",
        fileName: "youtube-studio-report.csv",
        startedAt: "2026-08-01T10:00:00.000Z",
        status: "completed",
        acceptedRecords: 12,
        rejectedRecords: 0,
      },
      {
        id: "import-2",
        platform: "tiktok",
        fileName: "tiktok-promotions-history.csv",
        startedAt: "2026-08-02T10:00:00.000Z",
        status: "completed",
        acceptedRecords: 5,
        rejectedRecords: 1,
      },
    ]);
  });

  it("marca plataforma como unknown quando o Dataset foi removido", () => {
    const rows = buildImportHistoryRows([IMPORT_YOUTUBE], []);

    expect(rows[0].platform).toBe("unknown");
  });
});
