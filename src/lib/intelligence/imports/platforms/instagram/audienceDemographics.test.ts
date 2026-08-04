import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  matchesAudienceDemographicsHeaders,
  normalizeAudienceDemographicsRecords,
  parseAudienceDemographicsRows,
} from "@/lib/intelligence/imports/platforms/instagram/audienceDemographics";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import type { ImportBatch, ImportFileDescriptor } from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/instagram/FollowerGender.xlsx", import.meta.url);

function fileDescriptor(): ImportFileDescriptor {
  return {
    id: "instagram-gender-fixture",
    name: "FollowerGender.xlsx",
    size: statSync(fixtureUrl).size,
    extension: "xlsx",
    format: "excel",
  };
}

function batch(): ImportBatch {
  return {
    id: "batch-instagram-gender",
    platform: "instagram",
    status: "detected",
    files: [fileDescriptor()],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

describe("matchesAudienceDemographicsHeaders", () => {
  it("reconhece os cabeçalhos do FollowerGender", () => {
    expect(matchesAudienceDemographicsHeaders(["Gender", "Distribution"])).toBe(true);
  });

  it("não reconhece cabeçalhos do FollowerTopTerritories (mesma coluna Distribution, mas sem Gender)", () => {
    expect(matchesAudienceDemographicsHeaders(["Top territories", "Distribution"])).toBe(false);
  });
});

describe("parseAudienceDemographicsRows + normalizeAudienceDemographicsRecords", () => {
  it("parseia e normaliza o export real do FollowerGender.xlsx (3 linhas, snapshot sem data)", async () => {
    const rows = await parseXlsxToRows(readFileSync(fixtureUrl));
    const { records: parsedRecords, issues: parseIssues } = parseAudienceDemographicsRows({ rows, fileId: "file-1" });

    expect(parseIssues).toEqual([]);
    expect(parsedRecords).toEqual([
      { platform: "instagram", kind: "audience_demographics", fileId: "file-1", row: 2, sourceRecord: { label: "Male", distribution: 0.63 } },
      { platform: "instagram", kind: "audience_demographics", fileId: "file-1", row: 3, sourceRecord: { label: "Female", distribution: 0.37 } },
      { platform: "instagram", kind: "audience_demographics", fileId: "file-1", row: 4, sourceRecord: { label: "Other", distribution: 0 } },
    ]);

    const result = normalizeAudienceDemographicsRecords({ records: parsedRecords, batch: batch() });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_demographics", label: "Male", distribution: 0.63 },
        source: { batchId: "batch-instagram-gender", fileId: "file-1", row: 2 },
      },
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_demographics", label: "Female", distribution: 0.37 },
        source: { batchId: "batch-instagram-gender", fileId: "file-1", row: 3 },
      },
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_demographics", label: "Other", distribution: 0 },
        source: { batchId: "batch-instagram-gender", fileId: "file-1", row: 4 },
      },
    ]);
  });

  it("ignora e reporta linhas com gênero ou distribuição inválidos", () => {
    const result = parseAudienceDemographicsRows({
      rows: [
        ["Gender", "Distribution"],
        ["Male", "0.63"],
        ["", "0.1"],
        ["Female", "abc"],
      ],
      fileId: "file-1",
    });

    expect(result.records).toHaveLength(1);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every((issue) => issue.code === "instagram-audience-demographics-invalid-row")).toBe(true);
  });

  it("retorna instagram-audience-demographics-missing-headers quando falta Distribution", () => {
    const result = parseAudienceDemographicsRows({ rows: [["Gender"]], fileId: "file-1" });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "instagram-audience-demographics-missing-headers",
        message: "O relatório de FollowerGender não possui as colunas obrigatórias: distribution.",
      },
    ]);
  });
});
