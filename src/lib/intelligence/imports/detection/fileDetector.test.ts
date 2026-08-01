import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IntelligenceFileDetector } from "@/lib/intelligence/imports/detection/fileDetector";
import type {
  ImportFileDescriptor,
  ImportFileFormat,
} from "@/lib/intelligence/imports/types";

const detector = new IntelligenceFileDetector();

function fixtureUrl(relativePath: string): URL {
  return new URL(`../test-data/${relativePath}`, import.meta.url);
}

function readFixture(relativePath: string): string {
  return readFileSync(fixtureUrl(relativePath), "utf8");
}

function firstLines(content: string): string[] {
  return content.split(/\r?\n/).filter(Boolean).slice(0, 3);
}

function descriptor(relativePath: string, format: ImportFileFormat = "unknown"): ImportFileDescriptor {
  const fileUrl = fixtureUrl(relativePath);
  const name = relativePath.split("/").pop() ?? relativePath;
  const extension = name.split(".").pop();

  return {
    id: name,
    name,
    size: statSync(fileUrl).size,
    extension,
    format,
    mimeType: "text/csv",
  };
}

describe("IntelligenceFileDetector", () => {
  it("detecta relatório do YouTube usando nome, extensão, cabeçalhos e primeiras linhas", async () => {
    const relativePath = "youtube/youtube-studio-report.csv";
    const content = readFixture(relativePath);

    await expect(
      detector.detect({
        file: descriptor(relativePath),
        firstLines: firstLines(content),
        contentSample: content,
      })
    ).resolves.toMatchObject({
      platform: "youtube",
      format: "csv",
      issues: [],
    });
  });

  it("detecta relatório do Instagram por cabeçalhos de Reels e alcance", async () => {
    const relativePath = "instagram/instagram-reels-insights.csv";
    const content = readFixture(relativePath);

    const result = await detector.detect({
      file: descriptor(relativePath),
      firstLines: firstLines(content),
      contentSample: content,
    });

    expect(result.platform).toBe("instagram");
    expect(result.format).toBe("csv");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("detecta relatório do TikTok por métricas de Creator Analytics", async () => {
    const relativePath = "tiktok/tiktok-creator-analytics.csv";
    const content = readFixture(relativePath);

    const result = await detector.detect({
      file: descriptor(relativePath),
      headers: ["Video title", "Video views", "Total play time", "Average watch time"],
      firstLines: firstLines(content),
    });

    expect(result.platform).toBe("tiktok");
    expect(result.format).toBe("csv");
    expect(result.issues).toEqual([]);
  });

  it("detecta relatório de Meta Ads por colunas de campanha paga", async () => {
    const relativePath = "meta-ads/meta-ads-campaigns.csv";
    const content = readFixture(relativePath);

    const result = await detector.detect({
      file: descriptor(relativePath),
      firstLines: firstLines(content),
      contentSample: content,
    });

    expect(result.platform).toBe("meta_ads");
    expect(result.format).toBe("csv");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("retorna unknown quando não encontra sinais suficientes de plataforma", async () => {
    const relativePath = "generic/generic-report.csv";
    const content = readFixture(relativePath);

    const result = await detector.detect({
      file: descriptor(relativePath),
      firstLines: firstLines(content),
      contentSample: content,
    });

    expect(result).toMatchObject({
      platform: "unknown",
      format: "csv",
      issues: [
        {
          stage: "detect",
          code: "unknown-platform",
        },
      ],
    });
  });
});
