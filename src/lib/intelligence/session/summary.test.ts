import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { previewImportFile } from "@/lib/intelligence/imports/preview";
import { summarizeImportPreview } from "@/lib/intelligence/session/summary";
import type { ImportFileDescriptor } from "@/lib/intelligence/imports/types";

function fixtureUrl(relativePath: string): URL {
  return new URL(`../imports/test-data/${relativePath}`, import.meta.url);
}

function readFixture(relativePath: string): string {
  return readFileSync(fixtureUrl(relativePath), "utf8");
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

describe("summarizeImportPreview", () => {
  it("achata um preview pronto do YouTube nos campos exigidos pela sessão", async () => {
    const relativePath = "youtube/youtube-studio-report.csv";
    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(summarizeImportPreview(result)).toEqual({
      platform: "youtube",
      confidence: expect.any(Number),
      period: { start: "2026-01-02", end: "2026-01-09" },
      recordCount: 2,
      metrics: [
        { key: "views", label: "Visualizações", total: 37520 },
        { key: "watchTimeHours", label: "Horas assistidas", total: 1996.7 },
        { key: "impressions", label: "Impressões", total: 211400 },
        { key: "subscribers", label: "Inscritos (ganho por vídeo)", total: 820 },
      ],
    });
  });

  it("retorna resumo vazio (com plataforma/confiança) quando não há adapter conectado", async () => {
    const relativePath = "instagram/instagram-reels-insights.csv";
    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    const summary = summarizeImportPreview(result);
    expect(summary.platform).toBe("instagram");
    expect(summary.recordCount).toBeNull();
    expect(summary.period).toBeNull();
    expect(summary.metrics).toEqual([]);
  });
});
