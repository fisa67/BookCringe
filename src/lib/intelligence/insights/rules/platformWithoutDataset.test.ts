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

describe("platformWithoutDatasetRule", () => {
  it("dispara para o YouTube quando ainda não existe nenhum Dataset", () => {
    const insights = platformWithoutDatasetRule.evaluate({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] });

    expect(insights).toEqual([
      {
        id: "platform-without-dataset:youtube",
        ruleId: "platform-without-dataset",
        severity: "info",
        title: "Plataforma sem Dataset",
        message: expect.stringContaining("YouTube"),
      },
    ]);
  });

  it("não dispara quando o Dataset do YouTube já existe", () => {
    const insights = platformWithoutDatasetRule.evaluate({
      now: NOW,
      datasets: [YOUTUBE_DATASET],
      imports: [],
      contents: [],
      metrics: [],
    });

    expect(insights).toEqual([]);
  });
});
