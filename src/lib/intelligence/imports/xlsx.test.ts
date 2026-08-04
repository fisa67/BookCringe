import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";

function fixtureUrl(relativePath: string): URL {
  return new URL(`./test-data/${relativePath}`, import.meta.url);
}

function readFixture(relativePath: string): Buffer {
  return readFileSync(fixtureUrl(relativePath));
}

describe("parseXlsxToRows", () => {
  it("lê a primeira planilha de um .xlsx real e devolve cabeçalho + linhas como string[][]", async () => {
    const buffer = readFixture("instagram/FollowerGender.xlsx");

    const rows = await parseXlsxToRows(buffer);

    expect(rows[0]).toEqual(["Gender", "Distribution"]);
    expect(rows.slice(1)).toEqual([
      ["Male", "0.63"],
      ["Female", "0.37"],
      ["Other", "0"],
    ]);
  });

  it("lê um .xlsx maior (FollowerActivity, 144 linhas de dados)", async () => {
    const buffer = readFixture("instagram/FollowerActivity.xlsx");

    const rows = await parseXlsxToRows(buffer);

    expect(rows[0]).toEqual(["Date", "Hour", "Active followers"]);
    expect(rows).toHaveLength(145);
    expect(rows[1]).toEqual(["25 de julho", "0", "795"]);
  });

  it("devolve lista vazia para um workbook sem planilhas", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const buffer = await workbook.xlsx.writeBuffer();

    const rows = await parseXlsxToRows(buffer as unknown as Buffer);

    expect(rows).toEqual([]);
  });

  it("ignora linhas totalmente vazias", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.addRow(["Territory", "Distribution"]);
    worksheet.addRow([]);
    worksheet.addRow(["BR", "0.9"]);
    const buffer = await workbook.xlsx.writeBuffer();

    const rows = await parseXlsxToRows(buffer as unknown as Buffer);

    expect(rows).toEqual([
      ["Territory", "Distribution"],
      ["BR", "0.9"],
    ]);
  });
});
