import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildInstagramAudiencePreview,
  summarizeInstagramAudienceMetrics,
} from "@/lib/intelligence/imports/platforms/instagram/audiencePreview";
import type { ImportFileDescriptor, NormalizedImportRecord } from "@/lib/intelligence/imports/types";
import type { InstagramAudiencePayload } from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

function fixtureUrl(name: string): URL {
  return new URL(`../../test-data/instagram/${name}`, import.meta.url);
}

function fileDescriptor(name: string): ImportFileDescriptor {
  const url = fixtureUrl(name);
  return { id: name, name, size: statSync(url).size, extension: "xlsx", format: "excel" };
}

describe("buildInstagramAudiencePreview", () => {
  it("detecta e monta o preview do FollowerHistory.xlsx (com virada de ano) a partir dos bytes do .xlsx", async () => {
    const buffer = readFileSync(fixtureUrl("FollowerHistory.xlsx"));

    const result = await buildInstagramAudiencePreview({
      file: fileDescriptor("FollowerHistory.xlsx"),
      buffer,
      referenceDate: new Date("2026-01-20"),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("esperava status ready");

    expect(result.platform).toBe("instagram");
    expect(result.preview.format).toBe("excel");
    expect(result.preview.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.preview.recordCount).toBe(30);
    expect(result.preview.kinds).toEqual([
      { kind: "audience_history", recordCount: 30, period: { start: "2025-12-17", end: "2026-01-15" } },
    ]);
    expect(result.preview.metrics).toEqual([
      { key: "followersLatest", label: "Seguidores (mais recente)", total: 4498 },
      { key: "followersDeltaTotal", label: "Variação de seguidores no período", total: 650 },
    ]);
    expect(result.preview.issues).toEqual([]);
  });

  it("detecta e monta o preview do FollowerActivity.xlsx", async () => {
    const buffer = readFileSync(fixtureUrl("FollowerActivity.xlsx"));

    const result = await buildInstagramAudiencePreview({
      file: fileDescriptor("FollowerActivity.xlsx"),
      buffer,
      referenceDate: new Date("2026-08-03"),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("esperava status ready");

    expect(result.preview.recordCount).toBe(144);
    expect(result.preview.kinds).toEqual([
      { kind: "audience_activity", recordCount: 144, period: { start: "2026-07-25", end: "2026-07-30" } },
    ]);
    expect(result.preview.metrics).toEqual([
      { key: "activeFollowersPeak", label: "Pico de seguidores ativos", total: 2119 },
      { key: "activeFollowersAverage", label: "Média de seguidores ativos", total: 1276.81 },
    ]);
  });

  it("detecta e monta o preview do FollowerGender.xlsx (snapshot, sem período)", async () => {
    const buffer = readFileSync(fixtureUrl("FollowerGender.xlsx"));

    const result = await buildInstagramAudiencePreview({ file: fileDescriptor("FollowerGender.xlsx"), buffer });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("esperava status ready");

    expect(result.preview.recordCount).toBe(3);
    expect(result.preview.kinds).toEqual([{ kind: "audience_demographics", recordCount: 3, period: null }]);
    expect(result.preview.metrics).toEqual([
      { key: "gender:Male", label: "Male", total: 0.63 },
      { key: "gender:Female", label: "Female", total: 0.37 },
      { key: "gender:Other", label: "Other", total: 0 },
    ]);
  });

  it("detecta e monta o preview do FollowerTopTerritories.xlsx (snapshot, sem período)", async () => {
    const buffer = readFileSync(fixtureUrl("FollowerTopTerritories.xlsx"));

    const result = await buildInstagramAudiencePreview({ file: fileDescriptor("FollowerTopTerritories.xlsx"), buffer });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("esperava status ready");

    expect(result.preview.recordCount).toBe(6);
    expect(result.preview.kinds).toEqual([{ kind: "audience_territories", recordCount: 6, period: null }]);
    expect(result.preview.metrics).toEqual([
      { key: "territory:BR", label: "BR", total: 0.896 },
      { key: "territory:MX", label: "MX", total: 0.003 },
      { key: "territory:US", label: "US", total: 0.002 },
      { key: "territory:CO", label: "CO", total: 0.001 },
      { key: "territory:NO", label: "NO", total: 0.001 },
      { key: "territory:Others", label: "Others", total: 0.097 },
    ]);
  });

  it("retorna unsupported para um arquivo que não bate com nenhum detector (ex.: planilha genérica)", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.addRow(["Coluna A", "Coluna B"]);
    worksheet.addRow(["1", "2"]);
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

    const result = await buildInstagramAudiencePreview({
      file: { id: "generic.xlsx", name: "generic.xlsx", size: buffer.length, extension: "xlsx", format: "excel" },
      buffer,
    });

    expect(result.status).toBe("unsupported");
  });
});

describe("summarizeInstagramAudienceMetrics", () => {
  function record(payload: InstagramAudiencePayload): NormalizedImportRecord<"instagram", InstagramAudiencePayload> {
    return {
      platform: "instagram",
      entityType: "audience_metric",
      payload,
      source: { batchId: "batch-1", fileId: "file-1" },
    };
  }

  it("retorna lista vazia quando não há registros", () => {
    expect(summarizeInstagramAudienceMetrics([])).toEqual([]);
  });

  it("soma corretamente mesmo se `records` misturar mais de um datasetKind", () => {
    const records = [
      record({ datasetKind: "audience_history", date: "2026-01-01", followers: 100, followersDelta: 5 }),
      record({ datasetKind: "audience_history", date: "2026-01-02", followers: 110, followersDelta: 10 }),
      record({ datasetKind: "audience_demographics", label: "Male", distribution: 0.6 }),
    ];

    expect(summarizeInstagramAudienceMetrics(records)).toEqual([
      { key: "followersLatest", label: "Seguidores (mais recente)", total: 110 },
      { key: "followersDeltaTotal", label: "Variação de seguidores no período", total: 15 },
      { key: "gender:Male", label: "Male", total: 0.6 },
    ]);
  });
});
