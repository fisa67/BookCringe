import { describe, expect, it } from "vitest";
import {
  instagramAudienceImporter,
  instagramAudienceParser,
  normalizeInstagramAudienceRows,
} from "@/lib/intelligence/imports/platforms/instagram/audienceParser";
import type { ImportBatch, ImportFileDescriptor, ParserInput } from "@/lib/intelligence/imports/types";

function fileDescriptor(name: string): ImportFileDescriptor {
  return { id: "instagram-fixture", name, size: 100, extension: "xlsx", format: "excel" };
}

function batch(): ImportBatch {
  return {
    id: "batch-instagram",
    platform: "instagram",
    status: "detected",
    files: [fileDescriptor("export.xlsx")],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

function input(rows: string[][]): ParserInput {
  return { batchId: "batch-instagram", platform: "instagram", file: fileDescriptor("export.xlsx"), payload: rows };
}

describe("instagramAudienceParser (Adapter único, dispatch pelas 4 schemas)", () => {
  it("reconhece e parseia FollowerHistory", async () => {
    const result = await instagramAudienceParser.parse(
      input([
        ["Date", "Followers", "Difference in followers from previous day"],
        ["31 de julho", "4200", "2"],
      ])
    );

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "instagram",
        kind: "audience_history",
        fileId: "instagram-fixture",
        row: 2,
        sourceRecord: { day: 31, month: 7, followers: 4200, followersDelta: 2 },
      },
    ]);
  });

  it("reconhece e parseia FollowerActivity", async () => {
    const result = await instagramAudienceParser.parse(
      input([
        ["Date", "Hour", "Active followers"],
        ["25 de julho", "0", "795"],
      ])
    );

    expect(result.issues).toEqual([]);
    expect(result.records[0]).toMatchObject({ kind: "audience_activity" });
  });

  it("reconhece e parseia FollowerGender", async () => {
    const result = await instagramAudienceParser.parse(
      input([
        ["Gender", "Distribution"],
        ["Male", "0.63"],
      ])
    );

    expect(result.issues).toEqual([]);
    expect(result.records[0]).toMatchObject({ kind: "audience_demographics" });
  });

  it("reconhece e parseia FollowerTopTerritories", async () => {
    const result = await instagramAudienceParser.parse(
      input([
        ["Top territories", "Distribution"],
        ["BR", "0.9"],
      ])
    );

    expect(result.issues).toEqual([]);
    expect(result.records[0]).toMatchObject({ kind: "audience_territories" });
  });

  it("retorna instagram-audience-unrecognized-format para cabeçalhos de nenhum dos 4 formatos", async () => {
    const result = await instagramAudienceParser.parse(input([["Foo", "Bar"]]));

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "instagram-audience-unrecognized-format",
        message:
          "Não foi possível reconhecer este relatório de audiência do Instagram (cabeçalhos não batem com FollowerHistory, FollowerActivity, FollowerGender nem FollowerTopTerritories).",
      },
    ]);
  });

  it("retorna instagram-audience-payload-not-rows quando o payload não é string[][] (ex.: uma string de CSV)", async () => {
    const result = await instagramAudienceParser.parse({
      batchId: "batch-instagram",
      platform: "instagram",
      file: fileDescriptor("export.csv"),
      payload: "Date,Followers\n31 de julho,4200\n",
    });

    expect(result.records).toEqual([]);
    expect(result.issues[0]?.code).toBe("instagram-audience-payload-not-rows");
  });

  it("retorna instagram-platform-mismatch quando input.platform não é instagram", async () => {
    const result = await instagramAudienceParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor("export.xlsx"),
      payload: [["Date", "Followers"]],
    });

    expect(result.issues[0]?.code).toBe("instagram-platform-mismatch");
  });
});

describe("normalizeInstagramAudienceRows (Adapter completo, mistura de kinds em um único payload de linhas)", () => {
  it("normaliza cada kind isoladamente, mesmo quando processado em lotes separados no mesmo batch", async () => {
    const historyResult = await normalizeInstagramAudienceRows({
      batch: batch(),
      input: input([
        ["Date", "Followers"],
        ["31 de julho", "4200"],
      ]),
      referenceDate: new Date("2026-08-03"),
    });

    const territoryResult = await normalizeInstagramAudienceRows({
      batch: batch(),
      input: input([
        ["Top territories", "Distribution"],
        ["BR", "0.9"],
      ]),
    });

    expect(historyResult.issues).toEqual([]);
    expect(historyResult.records).toEqual([
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_history", date: "2026-07-31", followers: 4200, followersDelta: 0 },
        source: { batchId: "batch-instagram", fileId: "instagram-fixture", row: 2 },
      },
    ]);

    expect(territoryResult.issues).toEqual([]);
    expect(territoryResult.records).toEqual([
      {
        platform: "instagram",
        entityType: "audience_metric",
        payload: { datasetKind: "audience_territories", territory: "BR", distribution: 0.9 },
        source: { batchId: "batch-instagram", fileId: "instagram-fixture", row: 2 },
      },
    ]);
  });
});

describe("instagramAudienceImporter", () => {
  it("expõe platform, parser e normalizer no formato de ImporterDefinition", () => {
    expect(instagramAudienceImporter.platform).toBe("instagram");
    expect(instagramAudienceImporter.parser).toBe(instagramAudienceParser);
    expect(typeof instagramAudienceImporter.normalizer.normalize).toBe("function");
  });
});
