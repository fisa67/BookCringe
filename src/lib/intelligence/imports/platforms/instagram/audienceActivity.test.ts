import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  matchesAudienceActivityHeaders,
  normalizeAudienceActivityRecords,
  parseAudienceActivityRows,
} from "@/lib/intelligence/imports/platforms/instagram/audienceActivity";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import type { ImportBatch, ImportFileDescriptor } from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/instagram/FollowerActivity.xlsx", import.meta.url);

function fileDescriptor(): ImportFileDescriptor {
  return {
    id: "instagram-activity-fixture",
    name: "FollowerActivity.xlsx",
    size: statSync(fixtureUrl).size,
    extension: "xlsx",
    format: "excel",
  };
}

function batch(): ImportBatch {
  return {
    id: "batch-instagram-activity",
    platform: "instagram",
    status: "detected",
    files: [fileDescriptor()],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

describe("matchesAudienceActivityHeaders", () => {
  it("reconhece os cabeçalhos do FollowerActivity", () => {
    expect(matchesAudienceActivityHeaders(["Date", "Hour", "Active followers"])).toBe(true);
  });

  it("não reconhece cabeçalhos do FollowerHistory (mesma coluna Date, mas sem Hour)", () => {
    expect(matchesAudienceActivityHeaders(["Date", "Followers"])).toBe(false);
  });
});

describe("parseAudienceActivityRows", () => {
  it("parseia linhas válidas (todas as 3 colunas são obrigatórias)", () => {
    const result = parseAudienceActivityRows({
      rows: [
        ["Date", "Hour", "Active followers"],
        ["25 de julho", "0", "795"],
        ["25 de julho", "1", "612"],
      ],
      fileId: "file-1",
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "instagram",
        kind: "audience_activity",
        fileId: "file-1",
        row: 2,
        sourceRecord: { day: 25, month: 7, hour: 0, activeFollowers: 795 },
      },
      {
        platform: "instagram",
        kind: "audience_activity",
        fileId: "file-1",
        row: 3,
        sourceRecord: { day: 25, month: 7, hour: 1, activeFollowers: 612 },
      },
    ]);
  });

  it("ignora e reporta linhas com hora fora do intervalo 0-23 ou valores inválidos", () => {
    const result = parseAudienceActivityRows({
      rows: [
        ["Date", "Hour", "Active followers"],
        ["25 de julho", "24", "795"],
        ["25 de julho", "abc", "795"],
        ["25 de julho", "2", "600"],
      ],
      fileId: "file-1",
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.row).toBe(4);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every((issue) => issue.code === "instagram-audience-activity-invalid-row")).toBe(true);
  });

  it("retorna instagram-audience-activity-missing-headers quando falta Hour", () => {
    const result = parseAudienceActivityRows({ rows: [["Date", "Active followers"]], fileId: "file-1" });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "instagram-audience-activity-missing-headers",
        message: "O relatório de FollowerActivity não possui as colunas obrigatórias: hour.",
      },
    ]);
  });
});

describe("normalizeAudienceActivityRecords", () => {
  it("normaliza para NormalizedImportRecord com datasetKind audience_activity", () => {
    const { records: parsedRecords } = parseAudienceActivityRows({
      rows: [
        ["Date", "Hour", "Active followers"],
        ["25 de julho", "0", "795"],
      ],
      fileId: "file-1",
    });

    const result = normalizeAudienceActivityRecords({
      records: parsedRecords,
      batch: batch(),
      referenceDate: new Date("2026-08-03"),
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_activity", date: "2026-07-25", hour: 0, activeFollowers: 795 },
        source: { batchId: "batch-instagram-activity", fileId: "file-1", row: 2 },
      },
    ]);
  });

  it("processa o export real do FollowerActivity.xlsx (144 linhas, 6 dias, sem virada de ano)", async () => {
    const rows = await parseXlsxToRows(readFileSync(fixtureUrl));
    const { records: parsedRecords, issues: parseIssues } = parseAudienceActivityRows({ rows, fileId: "file-1" });

    expect(parseIssues).toEqual([]);
    expect(parsedRecords).toHaveLength(144);

    const result = normalizeAudienceActivityRecords({
      records: parsedRecords,
      batch: batch(),
      referenceDate: new Date("2026-08-03"),
    });

    expect(result.issues).toEqual([]);
    const uniqueDates = new Set(result.records.map((record) => record.payload.date));
    expect(uniqueDates.size).toBe(6);
    expect(result.records[0]?.payload.date).toBe("2026-07-25");
    expect(result.records.at(-1)?.payload.date).toBe("2026-07-30");
  });
});
