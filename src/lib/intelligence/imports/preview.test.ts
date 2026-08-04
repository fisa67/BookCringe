import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { previewImportFile } from "@/lib/intelligence/imports/preview";
import type { ImportFileDescriptor } from "@/lib/intelligence/imports/types";

function fixtureUrl(relativePath: string): URL {
  return new URL(`./test-data/${relativePath}`, import.meta.url);
}

function readFixture(relativePath: string): string {
  return readFileSync(fixtureUrl(relativePath), "utf8");
}

function readBinaryFixture(relativePath: string): Buffer {
  return readFileSync(fixtureUrl(relativePath));
}

function descriptor(relativePath: string): ImportFileDescriptor {
  const fileUrl = fixtureUrl(relativePath);
  const name = relativePath.split("/").pop() ?? relativePath;

  return {
    id: name,
    name,
    size: statSync(fileUrl).size,
    extension: name.split(".").pop(),
    format: "unknown",
    mimeType: "text/csv",
  };
}

function xlsxDescriptor(relativePath: string): ImportFileDescriptor {
  const fileUrl = fixtureUrl(relativePath);
  const name = relativePath.split("/").pop() ?? relativePath;

  return {
    id: name,
    name,
    size: statSync(fileUrl).size,
    extension: "xlsx",
    format: "excel",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

describe("previewImportFile", () => {
  it("gera uma preview pronta para revisão a partir de um CSV do YouTube Studio", async () => {
    const relativePath = "youtube/youtube-studio-report.csv";

    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready" || result.platform !== "youtube") throw new Error("esperado status 'ready'/youtube");
    expect(result.preview.videoCount).toBe(2);
    expect(result.preview.issues).toEqual([]);
  });

  it("gera preview de TikTok Promotions com gasto, views e seguidores adquiridos", async () => {
    const relativePath = "tiktok/tiktok-promotions-history.csv";
    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready" || result.platform !== "tiktok") {
      throw new Error("esperado status 'ready'/tiktok");
    }
    expect(result.datasetKind).toBe("tiktok_promotions");
    expect(result.preview.recordCount).toBe(2);
    expect(result.preview.metrics).toEqual([
      { key: "promo:adCostBrl", label: "Gasto total", total: 2000 },
      { key: "promo:views", label: "Views", total: 80000 },
      { key: "promo:newFollowers", label: "Seguidores adquiridos", total: 1200 },
    ]);
  });

  it("retorna unsupported para TikTok Creator sem executar o adapter de Promotions", async () => {
    const relativePath = "tiktok/tiktok-creator-analytics.csv";
    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result).toMatchObject({
      status: "unsupported",
      platform: "tiktok",
      datasetKind: "tiktok_creator",
      issues: [{ code: "tiktok-creator-unsupported" }],
    });
  });

  it("marca como não suportado quando a plataforma detectada ainda não tem adapter conectado", async () => {
    const relativePath = "instagram/instagram-reels-insights.csv";

    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result).toMatchObject({ status: "unsupported", platform: "instagram" });
  });

  it("marca como não suportado quando não reconhece a plataforma do arquivo", async () => {
    const relativePath = "generic/generic-report.csv";

    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result).toMatchObject({ status: "unsupported", platform: "unknown" });
  });

  it("gera uma preview pronta para revisão a partir dos bytes de um .xlsx de audiência do Instagram (FollowerHistory)", async () => {
    const relativePath = "instagram/FollowerHistory.xlsx";

    const result = await previewImportFile({
      file: xlsxDescriptor(relativePath),
      buffer: readBinaryFixture(relativePath),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready" || result.platform !== "instagram") throw new Error("esperado status 'ready'/instagram");
    expect(result.preview.recordCount).toBe(30);
    expect(result.preview.kinds).toEqual([
      { kind: "audience_history", recordCount: 30, period: { start: "2025-12-17", end: "2026-01-15" } },
    ]);
    expect(result.preview.metrics.length).toBeGreaterThan(0);
    expect(result.preview.issues).toEqual([]);
  });

  it("marca como não suportado quando os bytes recebidos não batem com nenhum formato de audiência do Instagram", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.addRow(["Coluna A", "Coluna B"]);
    worksheet.addRow(["1", "2"]);
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

    const result = await previewImportFile({
      file: { id: "generic.xlsx", name: "generic.xlsx", size: buffer.length, extension: "xlsx", format: "excel" },
      buffer,
    });

    expect(result.status).toBe("unsupported");
  });
});
