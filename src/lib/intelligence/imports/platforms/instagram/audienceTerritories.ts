import type { ImportBatch, ImportIssue, NormalizeResult, ParseResult } from "@/lib/intelligence/imports/types";
import { getColumnValue, matchColumns } from "@/lib/intelligence/imports/columns";
import { INSTAGRAM_AUDIENCE_TERRITORY_SCHEMA } from "@/lib/intelligence/imports/platforms/instagram/columns";
import { parseAudienceNumber } from "@/lib/intelligence/imports/platforms/instagram/audienceNumber";
import type {
  InstagramAudienceNormalizedRecord,
  InstagramAudienceParsedRecord,
  InstagramAudienceTerritoryPayload,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

/**
 * `FollowerTopTerritories` do Instagram — mesma natureza de `FollowerGender`
 * (retrato/snapshot, sem coluna de data), mas por território em vez de
 * gênero. Kind próprio (`audience_territories`), não reaproveita
 * `audience_demographics`, porque o pedido as trata como famílias
 * separadas. Inclui a linha "Others" como um território normal — é um
 * valor de dado legítimo (percentual agregado do que não está no Top N),
 * não uma linha "Total" sem identidade como a do YouTube.
 */

export interface InstagramAudienceTerritoryParsedRecord extends InstagramAudienceParsedRecord {
  kind: "audience_territories";
  sourceRecord: { territory: string; distribution: number };
}

export function matchesAudienceTerritoryHeaders(headers: readonly string[]): boolean {
  return matchColumns(INSTAGRAM_AUDIENCE_TERRITORY_SCHEMA, headers).missingRequired.length === 0;
}

export function parseAudienceTerritoryRows(params: {
  rows: readonly string[][];
  fileId: string;
}): ParseResult<InstagramAudienceTerritoryParsedRecord> {
  const [headers, ...dataRows] = params.rows;
  if (!headers) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-territories-empty",
          message: "O relatório de FollowerTopTerritories do Instagram está vazio.",
        },
      ],
    };
  }

  const match = matchColumns(INSTAGRAM_AUDIENCE_TERRITORY_SCHEMA, headers);
  if (match.missingRequired.length > 0) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-territories-missing-headers",
          message: `O relatório de FollowerTopTerritories não possui as colunas obrigatórias: ${match.missingRequired.join(", ")}.`,
        },
      ],
    };
  }

  const issues: ImportIssue[] = [];
  const records: InstagramAudienceTerritoryParsedRecord[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const territory = getColumnValue(row, match, "territory") ?? "";
    const distribution = parseAudienceNumber(getColumnValue(row, match, "distribution"));

    if (!territory || distribution === null) {
      issues.push({
        stage: "parse",
        code: "instagram-audience-territories-invalid-row",
        message: `Linha ${rowNumber} ignorada: território ou distribuição inválidos.`,
        row: rowNumber,
      });
      return;
    }

    records.push({
      platform: "instagram",
      kind: "audience_territories",
      fileId: params.fileId,
      row: rowNumber,
      sourceRecord: { territory, distribution },
    });
  });

  return { records, issues };
}

export function normalizeAudienceTerritoryRecords(params: {
  records: readonly InstagramAudienceTerritoryParsedRecord[];
  batch: ImportBatch;
}): NormalizeResult<InstagramAudienceNormalizedRecord> {
  const records = params.records.map((record) => ({
    platform: "instagram" as const,
    entityType: "audience_metric" as const,
    payload: {
      datasetKind: "audience_territories" as const,
      territory: record.sourceRecord.territory,
      distribution: record.sourceRecord.distribution,
    } satisfies InstagramAudienceTerritoryPayload,
    source: { batchId: params.batch.id, fileId: record.fileId, row: record.row },
  }));

  return { records, issues: [] };
}
