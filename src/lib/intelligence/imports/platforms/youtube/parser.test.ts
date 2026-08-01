import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeYouTubeStudioCsv,
  youtubeStudioNormalizer,
  youtubeStudioParser,
} from "@/lib/intelligence/imports/platforms/youtube/parser";
import type {
  ImportBatch,
  ImportFileDescriptor,
  ParserInput,
} from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/youtube/youtube-studio-report.csv", import.meta.url);
const fixtureName = "youtube-studio-report.csv";

function readYouTubeFixture(): string {
  return readFileSync(fixtureUrl, "utf8");
}

function fileDescriptor(): ImportFileDescriptor {
  return {
    id: "youtube-fixture",
    name: fixtureName,
    size: statSync(fixtureUrl).size,
    mimeType: "text/csv",
    extension: "csv",
    format: "csv",
  };
}

function batch(): ImportBatch {
  return {
    id: "batch-youtube",
    platform: "youtube",
    status: "detected",
    files: [fileDescriptor()],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

function parserInput(): ParserInput {
  return {
    batchId: "batch-youtube",
    platform: "youtube",
    file: fileDescriptor(),
    payload: readYouTubeFixture(),
  };
}

describe("youtubeStudioImporter", () => {
  it("parseia o youtube-studio-report.csv sem persistir dados", async () => {
    const result = await youtubeStudioParser.parse(parserInput());

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual({
      platform: "youtube",
      fileId: "youtube-fixture",
      row: 2,
      sourceRecord: {
        videoTitle: "Como ler mais em 2026",
        videoPublishTime: "2026-01-02",
        views: 15420,
        watchTimeHours: 892.5,
        impressions: 91000,
        subscribers: 318,
      },
    });
  });

  it("normaliza registros do YouTube Studio para NormalizedImportRecord", async () => {
    const parseResult = await youtubeStudioParser.parse(parserInput());
    const result = await youtubeStudioNormalizer.normalize(parseResult.records, batch());

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual({
      platform: "youtube",
      entityType: "platform_metric",
      payload: {
        source: "youtube_studio",
        title: "Como ler mais em 2026",
        publishedAt: "2026-01-02",
        metrics: {
          views: 15420,
          watchTimeHours: 892.5,
          impressions: 91000,
          subscribers: 318,
        },
      },
      source: {
        batchId: "batch-youtube",
        fileId: "youtube-fixture",
        row: 2,
      },
    });
  });

  it("executa o adapter completo até o modelo normalizado", async () => {
    const result = await normalizeYouTubeStudioCsv({
      batch: batch(),
      input: parserInput(),
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "youtube",
        entityType: "platform_metric",
        payload: {
          source: "youtube_studio",
          title: "Como ler mais em 2026",
          publishedAt: "2026-01-02",
          metrics: {
            views: 15420,
            watchTimeHours: 892.5,
            impressions: 91000,
            subscribers: 318,
          },
        },
        source: {
          batchId: "batch-youtube",
          fileId: "youtube-fixture",
          row: 2,
        },
      },
      {
        platform: "youtube",
        entityType: "platform_metric",
        payload: {
          source: "youtube_studio",
          title: "Livros que mudaram minha rotina",
          publishedAt: "2026-01-09",
          metrics: {
            views: 22100,
            watchTimeHours: 1104.2,
            impressions: 120400,
            subscribers: 502,
          },
        },
        source: {
          batchId: "batch-youtube",
          fileId: "youtube-fixture",
          row: 3,
        },
      },
    ]);
  });
});
