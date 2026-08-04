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

  it("detecta relatório do YouTube em português, mesmo sem 'youtube' no nome do arquivo (i18n)", async () => {
    const relativePath = "youtube/youtube-studio-table-data-pt.csv";
    const content = readFixture(relativePath);

    const result = await detector.detect({
      file: {
        // Nome real que o YouTube Studio usa ao exportar — sem nenhuma
        // palavra que aponte para a plataforma, de propósito, para provar
        // que o sinal vem só dos cabeçalhos em português, não do nome.
        id: "table-data.csv",
        name: "Table data.csv",
        size: statSync(fixtureUrl(relativePath)).size,
        extension: "csv",
        format: "unknown",
        mimeType: "text/csv",
      },
      contentSample: content,
    });

    expect(result.platform).toBe("youtube");
    expect(result.format).toBe("csv");
    expect(result.issues).toEqual([]);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
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
    expect(result.datasetKind).toBe("tiktok_creator");
    expect(result.format).toBe("csv");
    expect(result.issues).toEqual([]);
  });

  it("detecta histórico de promoções do TikTok pelas colunas canônicas", async () => {
    const relativePath = "tiktok/tiktok-promotions-history.csv";
    const content = readFixture(relativePath);

    const result = await detector.detect({
      file: descriptor(relativePath),
      contentSample: content,
    });

    expect(result).toMatchObject({
      platform: "tiktok",
      datasetKind: "tiktok_promotions",
      format: "csv",
      issues: [],
    });
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
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
