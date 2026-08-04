import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  matchesAudienceHistoryHeaders,
  normalizeAudienceHistoryRecords,
  parseAudienceHistoryRows,
} from "@/lib/intelligence/imports/platforms/instagram/audienceHistory";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import type { ImportBatch, ImportFileDescriptor } from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/instagram/FollowerHistory.xlsx", import.meta.url);

function fileDescriptor(): ImportFileDescriptor {
  return {
    id: "instagram-history-fixture",
    name: "FollowerHistory.xlsx",
    size: statSync(fixtureUrl).size,
    extension: "xlsx",
    format: "excel",
  };
}

function batch(): ImportBatch {
  return {
    id: "batch-instagram-history",
    platform: "instagram",
    status: "detected",
    files: [fileDescriptor()],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

describe("matchesAudienceHistoryHeaders", () => {
  it("reconhece os cabeçalhos do FollowerHistory", () => {
    expect(matchesAudienceHistoryHeaders(["Date", "Followers", "Difference in followers from previous day"])).toBe(true);
  });

  it("não reconhece cabeçalhos de outro formato de audiência", () => {
    expect(matchesAudienceHistoryHeaders(["Gender", "Distribution"])).toBe(false);
  });
});

describe("parseAudienceHistoryRows", () => {
  it("parseia linhas simples, com followersDelta ausente degradando para 0", () => {
    const result = parseAudienceHistoryRows({
      rows: [
        ["Date", "Followers"],
        ["31 de julho", "4200"],
      ],
      fileId: "file-1",
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "instagram",
        kind: "audience_history",
        fileId: "file-1",
        row: 2,
        sourceRecord: { day: 31, month: 7, followers: 4200, followersDelta: 0 },
      },
    ]);
  });

  it("ignora e reporta linhas com data inválida ou seguidores inválidos, sem interromper o restante do arquivo", () => {
    const result = parseAudienceHistoryRows({
      rows: [
        ["Date", "Followers", "Difference in followers from previous day"],
        ["31 de julho", "4200", "10"],
        ["data-invalida", "4210", "10"],
        ["1 de agosto", "abc", "0"],
        ["2 de agosto", "4220", "10"],
      ],
      fileId: "file-1",
    });

    expect(result.records).toHaveLength(2);
    expect(result.records.map((record) => record.row)).toEqual([2, 5]);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toMatchObject({ code: "instagram-audience-history-invalid-date", row: 3 });
    expect(result.issues[1]).toMatchObject({ code: "instagram-audience-history-invalid-followers", row: 4 });
  });

  it("retorna instagram-audience-history-missing-headers quando falta uma coluna obrigatória", () => {
    const result = parseAudienceHistoryRows({ rows: [["Date"]], fileId: "file-1" });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "instagram-audience-history-missing-headers",
        message: "O relatório de FollowerHistory não possui as colunas obrigatórias: followers.",
      },
    ]);
  });

  it("retorna instagram-audience-history-empty para um arquivo sem nenhuma linha", () => {
    const result = parseAudienceHistoryRows({ rows: [], fileId: "file-1" });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      { stage: "parse", code: "instagram-audience-history-empty", message: "O relatório de FollowerHistory do Instagram está vazio." },
    ]);
  });
});

describe("normalizeAudienceHistoryRecords", () => {
  it("normaliza para NormalizedImportRecord com datasetKind explícito e entityType audience_metric", () => {
    const { records: parsedRecords } = parseAudienceHistoryRows({
      rows: [
        ["Date", "Followers", "Difference in followers from previous day"],
        ["30 de julho", "4198", "2"],
        ["31 de julho", "4200", "2"],
      ],
      fileId: "file-1",
    });

    const result = normalizeAudienceHistoryRecords({
      records: parsedRecords,
      batch: batch(),
      referenceDate: new Date("2026-08-03"),
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_history", date: "2026-07-30", followers: 4198, followersDelta: 2 },
        source: { batchId: "batch-instagram-history", fileId: "file-1", row: 2 },
      },
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_history", date: "2026-07-31", followers: 4200, followersDelta: 2 },
        source: { batchId: "batch-instagram-history", fileId: "file-1", row: 3 },
      },
    ]);
  });

  it("resolve corretamente uma virada de ano (dezembro → janeiro) no export real do FollowerHistory.xlsx", async () => {
    const rows = await parseXlsxToRows(readFileSync(fixtureUrl));
    const { records: parsedRecords, issues: parseIssues } = parseAudienceHistoryRows({ rows, fileId: "file-1" });

    expect(parseIssues).toEqual([]);
    expect(parsedRecords).toHaveLength(30);

    const result = normalizeAudienceHistoryRecords({
      records: parsedRecords,
      batch: batch(),
      referenceDate: new Date("2026-01-20"),
    });

    expect(result.issues).toEqual([]);
    // Primeira linha do fixture é "17 de dezembro" (2025) e a última é "15
    // de janeiro" (2026) — a virada de ano no meio do arquivo precisa ser
    // resolvida corretamente.
    expect(result.records[0]?.payload.date).toBe("2025-12-17");
    expect(result.records.find((record) => record.payload.date === "2025-12-31")).toBeTruthy();
    expect(result.records.find((record) => record.payload.date === "2026-01-01")).toBeTruthy();
    expect(result.records.at(-1)?.payload.date).toBe("2026-01-15");

    // As datas devem estar em ordem cronológica estritamente crescente.
    const dates = result.records.map((record) => record.payload.date);
    const sortedDates = [...dates].sort();
    expect(dates).toEqual(sortedDates);
  });
});
