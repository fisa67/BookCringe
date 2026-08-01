import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildYouTubeImportPreview,
  summarizeYouTubeRecords,
} from "@/lib/intelligence/imports/platforms/youtube/preview";
import type { DetectionResult, ImportFileDescriptor } from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/youtube/youtube-studio-report.csv", import.meta.url);

function fileDescriptor(): ImportFileDescriptor {
  return {
    id: "youtube-fixture",
    name: "youtube-studio-report.csv",
    size: statSync(fixtureUrl).size,
    mimeType: "text/csv",
    extension: "csv",
    format: "csv",
  };
}

function detectionResult(): DetectionResult {
  return { platform: "youtube", format: "csv", confidence: 0.95, issues: [] };
}

describe("buildYouTubeImportPreview", () => {
  it("resume período, quantidade de vídeos, métricas totais e confiança da detecção", async () => {
    const content = readFileSync(fixtureUrl, "utf8");

    const preview = await buildYouTubeImportPreview({
      file: fileDescriptor(),
      content,
      detection: detectionResult(),
    });

    expect(preview).toEqual({
      format: "csv",
      confidence: 0.95,
      videoCount: 2,
      period: { start: "2026-01-02", end: "2026-01-09" },
      issues: [],
      metrics: [
        { key: "views", label: "Visualizações", total: 37520 },
        { key: "watchTimeHours", label: "Horas assistidas", total: 1996.7 },
        { key: "impressions", label: "Impressões", total: 211400 },
        { key: "subscribers", label: "Inscritos (ganho por vídeo)", total: 820 },
      ],
    });
  });
});

describe("summarizeYouTubeRecords", () => {
  it("retorna período nulo e métricas zeradas quando não há registros", () => {
    expect(summarizeYouTubeRecords([])).toEqual({
      videoCount: 0,
      period: null,
      metrics: [
        { key: "views", label: "Visualizações", total: 0 },
        { key: "watchTimeHours", label: "Horas assistidas", total: 0 },
        { key: "impressions", label: "Impressões", total: 0 },
        { key: "subscribers", label: "Inscritos (ganho por vídeo)", total: 0 },
      ],
    });
  });
});
