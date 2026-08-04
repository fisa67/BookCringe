import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmImportAction,
  previewImportAction,
} from "@/app/admin/intelligence/importacoes/actions";

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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/services/intelligenceDatasetService", () => ({
  createImport: createImportMock,
  finalizeImport: finalizeImportMock,
  findOrCreateDataset: findOrCreateDatasetMock,
  insertMetrics: insertMetricsMock,
  upsertContent: upsertContentMock,
}));

/**
 * Cobre a fronteira real que a UI chama (`useImportSession` → Server
 * Action): `previewImportAction` precisa decidir sozinha, a partir da
 * extensão do arquivo, se lê como texto (YouTube, `.csv`) ou como bytes
 * binários (Instagram/audiência, `.xlsx`) antes de delegar para
 * `previewImportFile` — a mesma decisão que, hoje, `FileDropzone` já deixa
 * o usuário tomar ao aceitar os dois tipos de arquivo.
 */
function fixtureUrl(relativePath: string): URL {
  return new URL(`../../../../lib/intelligence/imports/test-data/${relativePath}`, import.meta.url);
}

function formDataWithFile(file: File): FormData {
  const formData = new FormData();
  formData.set("file", file);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  findOrCreateDatasetMock.mockResolvedValue({ id: "dataset-tiktok" });
  createImportMock.mockResolvedValue({ id: "import-tiktok" });
  insertMetricsMock.mockResolvedValue(true);
  finalizeImportMock.mockResolvedValue(true);
  upsertContentMock.mockResolvedValue({ id: "content-tiktok" });
});

describe("previewImportAction", () => {
  it("lê um .csv do YouTube Studio como texto e chega em 'ready'", async () => {
    const relativePath = "youtube/youtube-studio-report.csv";
    const content = readFileSync(fixtureUrl(relativePath), "utf8");
    const file = new File([content], "youtube-studio-report.csv", { type: "text/csv" });

    const result = await previewImportAction(formDataWithFile(file));

    expect(result.status).toBe("ready");
    expect(result.platform).toBe("youtube");
  });

  it("lê um .xlsx de audiência do Instagram como bytes binários e chega em 'ready'", async () => {
    const relativePath = "instagram/FollowerHistory.xlsx";
    const buffer = readFileSync(fixtureUrl(relativePath));
    const file = new File([buffer], "FollowerHistory.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await previewImportAction(formDataWithFile(file));

    expect(result.status).toBe("ready");
    expect(result.platform).toBe("instagram");
    if (result.status === "ready" && result.platform === "instagram") {
      expect(result.preview.recordCount).toBe(30);
    }
  });

  it("lê o CSV de promoções do TikTok como texto e chega em 'ready'", async () => {
    const relativePath = "tiktok/tiktok-promotions-history.csv";
    const content = readFileSync(fixtureUrl(relativePath), "utf8");
    const file = new File([content], "tiktok-promotions-history.csv", { type: "text/csv" });

    const result = await previewImportAction(formDataWithFile(file));

    expect(result).toMatchObject({
      status: "ready",
      platform: "tiktok",
      datasetKind: "tiktok_promotions",
    });
  });

  it("classifica TikTok Creator como unsupported", async () => {
    const relativePath = "tiktok/tiktok-creator-analytics.csv";
    const content = readFileSync(fixtureUrl(relativePath), "utf8");
    const file = new File([content], "tiktok-creator-analytics.csv", { type: "text/csv" });

    const result = await previewImportAction(formDataWithFile(file));

    expect(result).toMatchObject({
      status: "unsupported",
      platform: "tiktok",
      datasetKind: "tiktok_creator",
    });
  });

  it("rejeita quando nenhum arquivo foi enviado", async () => {
    await expect(previewImportAction(new FormData())).rejects.toThrow("Nenhum arquivo selecionado.");
  });
});

describe("confirmImportAction — paridade com Preview", () => {
  it("confirma TikTok Promotions pelo mesmo discriminador do Preview", async () => {
    const relativePath = "tiktok/tiktok-promotions-history.csv";
    const content = readFileSync(fixtureUrl(relativePath), "utf8");
    const file = new File([content], "tiktok-promotions-history.csv", { type: "text/csv" });

    const receipt = await confirmImportAction(formDataWithFile(file));

    expect(receipt.status).toBe("persisted");
    expect(findOrCreateDatasetMock).toHaveBeenCalledWith({
      platform: "tiktok",
      name: "TikTok — Promoções",
    });
    expect(insertMetricsMock).toHaveBeenCalled();
  });

  it("mantém TikTok Creator unsupported e nunca executa persistência de Promotions", async () => {
    const relativePath = "tiktok/tiktok-creator-analytics.csv";
    const content = readFileSync(fixtureUrl(relativePath), "utf8");
    const file = new File([content], "tiktok-creator-analytics.csv", { type: "text/csv" });

    const preview = await previewImportAction(formDataWithFile(file));
    const receipt = await confirmImportAction(formDataWithFile(file));

    expect(preview).toMatchObject({
      status: "unsupported",
      platform: "tiktok",
      datasetKind: "tiktok_creator",
    });
    expect(receipt).toMatchObject({
      status: "failed",
      issues: [{ code: "unsupported-import-format" }],
    });
    expect(findOrCreateDatasetMock).not.toHaveBeenCalled();
    expect(createImportMock).not.toHaveBeenCalled();
    expect(insertMetricsMock).not.toHaveBeenCalled();
  });
});
