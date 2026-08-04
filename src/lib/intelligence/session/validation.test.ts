import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { previewImportFile } from "@/lib/intelligence/imports/preview";
import { validateImportPreview } from "@/lib/intelligence/session/validation";
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

function xlsxDescriptor(relativePath: string): ImportFileDescriptor {
  const fileUrl = fixtureUrl(relativePath);
  const name = relativePath.split("/").pop() ?? relativePath;

  return { id: name, name, size: statSync(fileUrl).size, extension: "xlsx", format: "excel" };
}

async function preview(relativePath: string) {
  return previewImportFile({
    file: descriptor(relativePath),
    content: readFixture(relativePath),
  });
}

async function previewXlsx(relativePath: string) {
  const fileUrl = fixtureUrl(relativePath);
  return previewImportFile({
    file: xlsxDescriptor(relativePath),
    buffer: readFileSync(fileUrl),
  });
}

describe("validateImportPreview", () => {
  it("passa nos 5 critérios para um CSV do YouTube Studio (persistência já implementada)", async () => {
    const result = await preview("youtube/youtube-studio-report.csv");
    const validation = validateImportPreview(result);

    expect(validation.isValid).toBe(true);
    expect(validation.checks.map((check) => [check.key, check.passed])).toEqual([
      ["file", true],
      ["platform", true],
      ["structure", true],
      ["metrics", true],
      ["persistence", true],
    ]);
  });

  it("passa nos 5 critérios para TikTok Promotions", async () => {
    const result = await preview("tiktok/tiktok-promotions-history.csv");
    const validation = validateImportPreview(result);

    expect(validation.isValid).toBe(true);
    expect(validation.checks.map((check) => [check.key, check.passed])).toEqual([
      ["file", true],
      ["platform", true],
      ["structure", true],
      ["metrics", true],
      ["persistence", true],
    ]);
  });

  it("reconhece a plataforma mas falha na estrutura/métricas/persistência quando o adapter não existe", async () => {
    const result = await preview("instagram/instagram-reels-insights.csv");
    const validation = validateImportPreview(result);

    expect(validation.isValid).toBe(false);
    expect(validation.checks.map((check) => [check.key, check.passed])).toEqual([
      ["file", true],
      ["platform", true],
      ["structure", false],
      ["metrics", false],
      ["persistence", false],
    ]);
    expect(validation.checks.find((check) => check.key === "structure")?.message).toContain("Instagram");
  });

  it("falha em plataforma, estrutura, métricas e persistência quando o arquivo não é reconhecido", async () => {
    const result = await preview("generic/generic-report.csv");
    const validation = validateImportPreview(result);

    expect(validation.isValid).toBe(false);
    expect(validation.checks.map((check) => [check.key, check.passed])).toEqual([
      ["file", true],
      ["platform", false],
      ["structure", false],
      ["metrics", false],
      ["persistence", false],
    ]);
  });

  it("Instagram (audiência): passa nos 5 critérios desde a Sprint 14 (persistência implementada)", async () => {
    const result = await previewXlsx("instagram/FollowerHistory.xlsx");
    const validation = validateImportPreview(result);

    expect(validation.isValid).toBe(true);
    expect(validation.checks.map((check) => [check.key, check.passed])).toEqual([
      ["file", true],
      ["platform", true],
      ["structure", true],
      ["metrics", true],
      ["persistence", true],
    ]);
    expect(validation.checks.find((check) => check.key === "persistence")?.message).toContain("Instagram");
  });
});
