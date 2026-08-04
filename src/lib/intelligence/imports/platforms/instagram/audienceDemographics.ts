import type { ImportBatch, ImportIssue, NormalizeResult, ParseResult } from "@/lib/intelligence/imports/types";
import { getColumnValue, matchColumns } from "@/lib/intelligence/imports/columns";
import { INSTAGRAM_AUDIENCE_DEMOGRAPHICS_SCHEMA } from "@/lib/intelligence/imports/platforms/instagram/columns";
import { parseAudienceNumber } from "@/lib/intelligence/imports/platforms/instagram/audienceNumber";
import type {
  InstagramAudienceDemographicsPayload,
  InstagramAudienceNormalizedRecord,
  InstagramAudienceParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

/**
 * `FollowerGender` do Instagram — não é uma série temporal (sem coluna de
 * data): é um retrato ("snapshot") da distribuição de seguidores por
 * gênero no momento do export. Cada linha vira um registro independente
 * (`label` + `distribution`), sem tentar inventar uma data.
 */

export interface InstagramAudienceDemographicsParsedRecord extends InstagramAudienceParsedRecord {
  kind: "audience_demographics";
  sourceRecord: { label: string; distribution: number };
}

export function matchesAudienceDemographicsHeaders(headers: readonly string[]): boolean {
  return matchColumns(INSTAGRAM_AUDIENCE_DEMOGRAPHICS_SCHEMA, headers).missingRequired.length === 0;
}

export function parseAudienceDemographicsRows(params: {
  rows: readonly string[][];
  fileId: string;
}): ParseResult<InstagramAudienceDemographicsParsedRecord> {
  const [headers, ...dataRows] = params.rows;
  if (!headers) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-demographics-empty",
          message: "O relatório de FollowerGender do Instagram está vazio.",
        },
      ],
    };
  }

  const match = matchColumns(INSTAGRAM_AUDIENCE_DEMOGRAPHICS_SCHEMA, headers);
  if (match.missingRequired.length > 0) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-demographics-missing-headers",
          message: `O relatório de FollowerGender não possui as colunas obrigatórias: ${match.missingRequired.join(", ")}.`,
        },
      ],
    };
  }

  const issues: ImportIssue[] = [];
  const records: InstagramAudienceDemographicsParsedRecord[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const label = getColumnValue(row, match, "gender") ?? "";
    const distribution = parseAudienceNumber(getColumnValue(row, match, "distribution"));

    if (!label || distribution === null) {
      issues.push({
        stage: "parse",
        code: "instagram-audience-demographics-invalid-row",
        message: `Linha ${rowNumber} ignorada: gênero ou distribuição inválidos.`,
        row: rowNumber,
      });
      return;
    }

    records.push({
      platform: "instagram",
      kind: "audience_demographics",
      fileId: params.fileId,
      row: rowNumber,
      sourceRecord: { label, distribution },
    });
  });

  return { records, issues };
}

export function normalizeAudienceDemographicsRecords(params: {
  records: readonly InstagramAudienceDemographicsParsedRecord[];
  batch: ImportBatch;
}): NormalizeResult<InstagramAudienceNormalizedRecord> {
  const records = params.records.map((record) => ({
    platform: "instagram" as const,
    entityType: "audience_metric" as const,
    payload: {
      datasetKind: "audience_demographics" as const,
      label: record.sourceRecord.label,
      distribution: record.sourceRecord.distribution,
    } satisfies InstagramAudienceDemographicsPayload,
    source: { batchId: params.batch.id, fileId: record.fileId, row: record.row },
  }));

  return { records, issues: [] };
}
