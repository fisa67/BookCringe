import { readFileSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { previewImportFile } from "@/lib/intelligence/imports/preview";
import { instagramAudiencePersistence } from "@/lib/intelligence/imports/platforms/instagram/persistence";
import type { ImportBatch, ImportFileDescriptor } from "@/lib/intelligence/imports/types";
import type { IntelligenceMetricCreate } from "@/lib/types/intelligence";

/**
 * Evidência de ponta a ponta da Sprint 14 ("Instagram Persistence",
 * `docs/intelligence/AUDIENCE_PERSISTENCE.md`), para os 4 formatos reais:
 *
 *   Arquivo .xlsx → Detection → Preview → Persistência → Dataset criado →
 *   Import completed → Metrics persistidas → Status imported
 *
 * Usa os arquivos `.xlsx` reais de `imports/test-data/instagram/` (os
 * mesmos já usados por `audiencePreview.test.ts`) através do dispatcher de
 * produção `previewImportFile` — exatamente o mesmo código que
 * `previewImportAction` (Server Action) chama — e então entrega os
 * `NormalizedImportRecord[]` resultantes para `instagramAudiencePersistence`
 * de verdade. Só a fronteira de rede (`@/lib/services/intelligenceDatasetService`,
 * o client do Supabase) é mockada — não há Supabase local disponível neste
 * ambiente —, mesma fronteira que `youtube/persistence.test.ts` já usa.
 */

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

function fixtureUrl(name: string): URL {
  return new URL(`../../test-data/instagram/${name}`, import.meta.url);
}

function fileDescriptor(name: string): ImportFileDescriptor {
  const url = fixtureUrl(name);
  return { id: randomUUID(), name, size: statSync(url).size, extension: "xlsx", format: "excel" };
}

const DATASET_ROW = {
  id: "dataset-instagram-audience",
  platform: "instagram" as const,
  name: "Instagram — Audiência",
  created_at: "2026-08-03T00:00:00.000Z",
  updated_at: "2026-08-03T00:00:00.000Z",
};

/** Cada teste recebe um Import novo (id previsível pelo `fileName`) — assim os `expect` por arquivo não colidem. */
function importRowFor(fileName: string) {
  return {
    id: `import-${fileName}`,
    dataset_id: DATASET_ROW.id,
    status: "processing" as const,
    file_name: fileName,
    accepted_records: 0,
    rejected_records: 0,
    started_at: "2026-08-03T00:00:00.000Z",
  };
}

beforeEach(() => {
  createImportMock.mockReset();
  finalizeImportMock.mockReset();
  findOrCreateDatasetMock.mockReset();
  insertMetricsMock.mockReset();

  findOrCreateDatasetMock.mockResolvedValue(DATASET_ROW);
  finalizeImportMock.mockResolvedValue(true);
  insertMetricsMock.mockResolvedValue(true);
});

/** Achata todas as chamadas a `insertMetrics` num único array — cada chamada persiste 1 registro (1+ linhas de Metric). */
function allPersistedMetricRows(): IntelligenceMetricCreate[] {
  return insertMetricsMock.mock.calls.flatMap((call) => call[0] as IntelligenceMetricCreate[]);
}

describe("Instagram — Sprint 14: fluxo real de ponta a ponta (Detection → Preview → Persistência)", () => {
  it("FollowerHistory.xlsx: 30 registros diários viram Metric 'followers'/'followersDelta' sem Content", async () => {
    createImportMock.mockResolvedValue(importRowFor("FollowerHistory.xlsx"));
    const buffer = readFileSync(fixtureUrl("FollowerHistory.xlsx"));
    const file = fileDescriptor("FollowerHistory.xlsx");

    const preview = await previewImportFile({ file, buffer });
    expect(preview.status).toBe("ready");
    if (preview.status !== "ready" || preview.platform !== "instagram") {
      throw new Error("esperava Detection Preview 'ready' para o Instagram");
    }
    expect(preview.preview.recordCount).toBe(30);

    const batch: ImportBatch = {
      id: randomUUID(),
      platform: "instagram",
      status: "detected",
      files: [file],
      createdAt: "2026-08-03T12:00:00.000Z",
    };

    const receipt = await instagramAudiencePersistence.persist(preview.preview.records, batch);

    // Dataset criado (findOrCreate, sempre o mesmo nome — 1 Dataset para os 4 formatos).
    expect(findOrCreateDatasetMock).toHaveBeenCalledWith({ platform: "instagram", name: "Instagram — Audiência" });
    // Import completed.
    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-FollowerHistory.xlsx",
      status: "completed",
      acceptedRecords: 30,
      rejectedRecords: 0,
    });
    // Status imported (PersistenceReceipt "persisted", equivalente ao que a UI usa para chegar em "imported").
    expect(receipt).toEqual({
      batchId: batch.id,
      status: "persisted",
      acceptedRecords: 30,
      rejectedRecords: 0,
      issues: [],
    });

    // Metrics persistidas: 30 dias × 2 métricas (followers + followersDelta) = 60 linhas, nenhuma com content_id.
    const rows = allPersistedMetricRows();
    expect(rows).toHaveLength(60);
    expect(rows.every((row) => row.content_id === undefined)).toBe(true);
    expect(rows.every((row) => row.dataset_id === DATASET_ROW.id && row.import_id === "import-FollowerHistory.xlsx")).toBe(
      true
    );
    // O total de seguidores mais recente conhecido da fixture (audiencePreview.test.ts) é 4498, em 2026-01-15 ou 2025-12-...
    const latestFollowers = rows.filter((row) => row.key === "followers").sort((a, b) => a.measured_at.localeCompare(b.measured_at));
    expect(latestFollowers[latestFollowers.length - 1].value).toBe(4498);
    const totalDelta = rows.filter((row) => row.key === "followersDelta").reduce((sum, row) => sum + row.value, 0);
    expect(totalDelta).toBe(650);
  });

  it("FollowerActivity.xlsx: 144 registros (6 dias × 24h) viram Metric 'activeFollowers' com measured_at combinando data+hora", async () => {
    createImportMock.mockResolvedValue(importRowFor("FollowerActivity.xlsx"));
    const buffer = readFileSync(fixtureUrl("FollowerActivity.xlsx"));
    const file = fileDescriptor("FollowerActivity.xlsx");

    const preview = await previewImportFile({ file, buffer });
    expect(preview.status).toBe("ready");
    if (preview.status !== "ready" || preview.platform !== "instagram") {
      throw new Error("esperava Detection Preview 'ready' para o Instagram");
    }
    expect(preview.preview.recordCount).toBe(144);

    const batch: ImportBatch = {
      id: randomUUID(),
      platform: "instagram",
      status: "detected",
      files: [file],
      createdAt: "2026-08-03T12:00:00.000Z",
    };

    const receipt = await instagramAudiencePersistence.persist(preview.preview.records, batch);

    expect(receipt.status).toBe("persisted");
    expect(receipt.acceptedRecords).toBe(144);
    expect(receipt.rejectedRecords).toBe(0);
    expect(finalizeImportMock).toHaveBeenCalledWith({
      id: "import-FollowerActivity.xlsx",
      status: "completed",
      acceptedRecords: 144,
      rejectedRecords: 0,
    });

    const rows = allPersistedMetricRows();
    expect(rows).toHaveLength(144);
    expect(rows.every((row) => row.key === "activeFollowers" && row.content_id === undefined)).toBe(true);
    // measured_at combina a data resolvida (`audienceDate.ts`) com a hora, formato `YYYY-MM-DDTHH:00:00.000Z`.
    expect(rows.every((row) => /^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/.test(row.measured_at))).toBe(true);
    const peak = Math.max(...rows.map((row) => row.value));
    const average = rows.reduce((sum, row) => sum + row.value, 0) / rows.length;
    expect(peak).toBe(2119);
    expect(Math.round(average * 100) / 100).toBe(1276.81);
  });

  it("FollowerGender.xlsx: 3 linhas (Male/Female/Other) viram Metric com a categoria na key, measured_at = data do Import", async () => {
    createImportMock.mockResolvedValue(importRowFor("FollowerGender.xlsx"));
    const buffer = readFileSync(fixtureUrl("FollowerGender.xlsx"));
    const file = fileDescriptor("FollowerGender.xlsx");

    const preview = await previewImportFile({ file, buffer });
    expect(preview.status).toBe("ready");
    if (preview.status !== "ready" || preview.platform !== "instagram") {
      throw new Error("esperava Detection Preview 'ready' para o Instagram");
    }
    expect(preview.preview.recordCount).toBe(3);

    const batch: ImportBatch = {
      id: randomUUID(),
      platform: "instagram",
      status: "detected",
      files: [file],
      createdAt: "2026-08-03T12:00:00.000Z",
    };

    const receipt = await instagramAudiencePersistence.persist(preview.preview.records, batch);

    expect(receipt).toMatchObject({ status: "persisted", acceptedRecords: 3, rejectedRecords: 0 });

    const rows = allPersistedMetricRows();
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.content_id === undefined && row.unit === "ratio")).toBe(true);
    expect(rows.every((row) => row.measured_at === batch.createdAt)).toBe(true);
    expect(rows.map((row) => [row.key, row.value])).toEqual([
      ["gender:Male", 0.63],
      ["gender:Female", 0.37],
      ["gender:Other", 0],
    ]);
  });

  it("FollowerTopTerritories.xlsx: 6 territórios (incluindo 'Others') viram Metric com a categoria na key", async () => {
    createImportMock.mockResolvedValue(importRowFor("FollowerTopTerritories.xlsx"));
    const buffer = readFileSync(fixtureUrl("FollowerTopTerritories.xlsx"));
    const file = fileDescriptor("FollowerTopTerritories.xlsx");

    const preview = await previewImportFile({ file, buffer });
    expect(preview.status).toBe("ready");
    if (preview.status !== "ready" || preview.platform !== "instagram") {
      throw new Error("esperava Detection Preview 'ready' para o Instagram");
    }
    expect(preview.preview.recordCount).toBe(6);

    const batch: ImportBatch = {
      id: randomUUID(),
      platform: "instagram",
      status: "detected",
      files: [file],
      createdAt: "2026-08-03T12:00:00.000Z",
    };

    const receipt = await instagramAudiencePersistence.persist(preview.preview.records, batch);

    expect(receipt).toMatchObject({ status: "persisted", acceptedRecords: 6, rejectedRecords: 0 });

    const rows = allPersistedMetricRows();
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.content_id === undefined && row.unit === "ratio")).toBe(true);
    expect(rows.map((row) => [row.key, row.value])).toEqual([
      ["territory:BR", 0.896],
      ["territory:MX", 0.003],
      ["territory:US", 0.002],
      ["territory:CO", 0.001],
      ["territory:NO", 0.001],
      ["territory:Others", 0.097],
    ]);
  });

  it("os 4 formatos reaproveitam o mesmo Dataset — nenhum upsertContent é chamado em nenhum dos 4 fluxos", async () => {
    createImportMock.mockResolvedValue(importRowFor("FollowerGender.xlsx"));
    const buffer = readFileSync(fixtureUrl("FollowerGender.xlsx"));
    const file = fileDescriptor("FollowerGender.xlsx");
    const preview = await previewImportFile({ file, buffer });
    if (preview.status !== "ready" || preview.platform !== "instagram") throw new Error("esperava ready");

    await instagramAudiencePersistence.persist(preview.preview.records, {
      id: randomUUID(),
      platform: "instagram",
      status: "detected",
      files: [file],
      createdAt: "2026-08-03T12:00:00.000Z",
    });

    // `intelligenceDatasetService.upsertContent` nem é importado por `persistence.ts` — não há Content
    // artificial para audiência (item 2/6 do escopo da Sprint 14, `AUDIENCE_PERSISTENCE.md`).
    expect(findOrCreateDatasetMock).toHaveBeenCalledTimes(1);
    expect(findOrCreateDatasetMock).toHaveBeenCalledWith({ platform: "instagram", name: "Instagram — Audiência" });
  });
});
