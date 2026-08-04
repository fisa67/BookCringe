import { describe, expect, it } from "vitest";
import { platformWithoutDatasetRule } from "@/lib/intelligence/insights/rules/platformWithoutDataset";
import type { IntelligenceDatasetRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

const YOUTUBE_DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const INSTAGRAM_DATASET: IntelligenceDatasetRecord = {
  id: "dataset-2",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const TIKTOK_DATASET: IntelligenceDatasetRecord = {
  id: "dataset-3",
  platform: "tiktok",
  name: "TikTok — Promoções",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("platformWithoutDatasetRule", () => {
  it("dispara para todas as plataformas com persistência quando ainda não existe Dataset", () => {
    const insights = platformWithoutDatasetRule.evaluate({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] });

    expect(insights).toEqual([
      {
        id: "platform-without-dataset:youtube",
        ruleId: "platform-without-dataset",
        severity: "info",
        title: "Plataforma sem Dataset",
        message: expect.stringContaining("YouTube"),
      },
      {
        id: "platform-without-dataset:instagram",
        ruleId: "platform-without-dataset",
        severity: "info",
        title: "Plataforma sem Dataset",
        message: expect.stringContaining("Instagram"),
      },
      {
        id: "platform-without-dataset:tiktok",
        ruleId: "platform-without-dataset",
        severity: "info",
        title: "Plataforma sem Dataset",
        message: expect.stringContaining("TikTok"),
      },
    ]);
  });

  it("não dispara para o YouTube quando seu Dataset já existe", () => {
    const insights = platformWithoutDatasetRule.evaluate({
      now: NOW,
      datasets: [YOUTUBE_DATASET],
      imports: [],
      contents: [],
      metrics: [],
    });

    expect(insights).toEqual([
      {
        id: "platform-without-dataset:instagram",
        ruleId: "platform-without-dataset",
        severity: "info",
        title: "Plataforma sem Dataset",
        message: expect.stringContaining("Instagram"),
      },
      {
        id: "platform-without-dataset:tiktok",
        ruleId: "platform-without-dataset",
        severity: "info",
        title: "Plataforma sem Dataset",
        message: expect.stringContaining("TikTok"),
      },
    ]);
  });

  it("não dispara quando todos os Datasets já existem", () => {
    const insights = platformWithoutDatasetRule.evaluate({
      now: NOW,
      datasets: [YOUTUBE_DATASET, INSTAGRAM_DATASET, TIKTOK_DATASET],
      imports: [],
      contents: [],
      metrics: [],
    });

    expect(insights).toEqual([]);
  });
});
