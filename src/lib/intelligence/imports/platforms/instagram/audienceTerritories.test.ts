import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  matchesAudienceTerritoryHeaders,
  normalizeAudienceTerritoryRecords,
  parseAudienceTerritoryRows,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTerritories";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import type { ImportBatch, ImportFileDescriptor } from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/instagram/FollowerTopTerritories.xlsx", import.meta.url);

function fileDescriptor(): ImportFileDescriptor {
  return {
    id: "instagram-territories-fixture",
    name: "FollowerTopTerritories.xlsx",
    size: statSync(fixtureUrl).size,
    extension: "xlsx",
    format: "excel",
  };
}

function batch(): ImportBatch {
  return {
    id: "batch-instagram-territories",
    platform: "instagram",
    status: "detected",
    files: [fileDescriptor()],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

describe("matchesAudienceTerritoryHeaders", () => {
  it("reconhece os cabeçalhos do FollowerTopTerritories", () => {
    expect(matchesAudienceTerritoryHeaders(["Top territories", "Distribution"])).toBe(true);
  });

  it("não reconhece cabeçalhos do FollowerGender (mesma coluna Distribution, mas sem Top territories)", () => {
    expect(matchesAudienceTerritoryHeaders(["Gender", "Distribution"])).toBe(false);
  });
});

describe("parseAudienceTerritoryRows + normalizeAudienceTerritoryRecords", () => {
  it("parseia e normaliza o export real do FollowerTopTerritories.xlsx, incluindo a linha agregada 'Others' como um território normal", async () => {
    const rows = await parseXlsxToRows(readFileSync(fixtureUrl));
    const { records: parsedRecords, issues: parseIssues } = parseAudienceTerritoryRows({ rows, fileId: "file-1" });

    expect(parseIssues).toEqual([]);
    expect(parsedRecords.map((record) => record.sourceRecord)).toEqual([
      { territory: "BR", distribution: 0.896 },
      { territory: "MX", distribution: 0.003 },
      { territory: "US", distribution: 0.002 },
      { territory: "CO", distribution: 0.001 },
      { territory: "NO", distribution: 0.001 },
      { territory: "Others", distribution: 0.097 },
    ]);

    const result = normalizeAudienceTerritoryRecords({ records: parsedRecords, batch: batch() });

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(6);
    expect(result.records[0]).toEqual({
      platform: "instagram",
      entityType: "audience_metric",
      payload: { datasetKind: "audience_territories", territory: "BR", distribution: 0.896 },
      source: { batchId: "batch-instagram-territories", fileId: "file-1", row: 2 },
    });
    expect(result.records.at(-1)?.payload).toEqual({ datasetKind: "audience_territories", territory: "Others", distribution: 0.097 });
  });

  it("ignora e reporta linhas com território ou distribuição inválidos", () => {
    const result = parseAudienceTerritoryRows({
      rows: [
        ["Top territories", "Distribution"],
        ["BR", "0.9"],
        ["", "0.05"],
        ["US", "abc"],
      ],
      fileId: "file-1",
    });

    expect(result.records).toHaveLength(1);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every((issue) => issue.code === "instagram-audience-territories-invalid-row")).toBe(true);
  });

  it("retorna instagram-audience-territories-missing-headers quando falta Top territories", () => {
    const result = parseAudienceTerritoryRows({ rows: [["Distribution"]], fileId: "file-1" });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "instagram-audience-territories-missing-headers",
        message: "O relatório de FollowerTopTerritories não possui as colunas obrigatórias: territory.",
      },
    ]);
  });
});
