import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeTikTokPromotionsCsv } from "@/lib/intelligence/imports/platforms/tiktok/promotionsParser";
import type { ImportBatch, ImportFileDescriptor, ParserInput } from "@/lib/intelligence/imports/types";

const content = readFileSync(
  new URL("../../test-data/tiktok/tiktok-promotions-history.csv", import.meta.url),
  "utf8"
);
const file: ImportFileDescriptor = {
  id: "file-1",
  name: "tiktok-promotions-history.csv",
  size: content.length,
  format: "csv",
};
const batch: ImportBatch = {
  id: "batch-1",
  platform: "tiktok",
  status: "detected",
  files: [file],
  createdAt: "2026-08-04T12:00:00.000Z",
};

function input(payload: unknown = content): ParserInput {
  return { batchId: batch.id, platform: "tiktok", file, payload };
}

describe("TikTok Promotions adapter", () => {
  it("normaliza fatos brutos como campaign_metric e descarta custos derivados", async () => {
    const result = await normalizeTikTokPromotionsCsv({ batch, input: input() });

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      platform: "tiktok",
      entityType: "campaign_metric",
      payload: {
        source: "tiktok_promotions",
        measuredAt: "2026-07-01T00:00:00.000Z",
        metrics: {
          "promo:adCostBrl": 1200.5,
          "promo:views": 48000,
          "promo:newFollowers": 720,
        },
      },
    });
    expect(Object.keys(result.records[0].payload.metrics)).not.toContain("costPerView");
    expect(Object.keys(result.records[0].payload.metrics)).not.toContain("costPerFollower");
  });

  it("rejeita linhas com fatos brutos inválidos", async () => {
    const csv = [
      "date,ad_cost_brl,video_views,new_followers",
      "2026-07-01,abc,100,2",
      "2026-07-02,10,200,4",
    ].join("\n");
    const result = await normalizeTikTokPromotionsCsv({ batch, input: input(csv) });

    expect(result.records).toHaveLength(1);
    expect(result.issues).toMatchObject([{ code: "tiktok-promotions-invalid-row", row: 2 }]);
  });

  it("rejeita o arquivo quando a coluna de data obrigatória está ausente", async () => {
    const csv = "ad_cost_brl,video_views,new_followers\n10,200,4";
    const result = await normalizeTikTokPromotionsCsv({ batch, input: input(csv) });

    expect(result.records).toEqual([]);
    expect(result.issues).toMatchObject([
      {
        code: "tiktok-promotions-missing-headers",
        message: expect.stringContaining("measuredAt"),
      },
    ]);
  });

  it("rejeita uma linha quando a data está vazia ou inválida", async () => {
    const csv = [
      "date,ad_cost_brl,video_views,new_followers",
      ",10,200,4",
      "data-invalida,20,300,6",
      "2026-07-03,30,400,8",
    ].join("\n");
    const result = await normalizeTikTokPromotionsCsv({ batch, input: input(csv) });

    expect(result.records).toHaveLength(1);
    expect(result.issues).toMatchObject([
      { code: "tiktok-promotions-invalid-row", row: 2 },
      { code: "tiktok-promotions-invalid-row", row: 3 },
    ]);
  });
});
