import type { ImportBatch, ImportIssue, NormalizeResult, ParseResult } from "@/lib/intelligence/imports/types";
import { getColumnValue, matchColumns } from "@/lib/intelligence/imports/columns";
import { INSTAGRAM_AUDIENCE_ACTIVITY_SCHEMA } from "@/lib/intelligence/imports/platforms/instagram/columns";
import { parsePtBrDayMonth, resolveYearForSequentialDates } from "@/lib/intelligence/imports/platforms/instagram/audienceDate";
import { parseAudienceNumber } from "@/lib/intelligence/imports/platforms/instagram/audienceNumber";
import type {
  InstagramAudienceActivityPayload,
  InstagramAudienceNormalizedRecord,
  InstagramAudienceParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

/**
 * `FollowerActivity` do Instagram — seguidores ativos por hora, dentro de
 * cada dia (0 a 23h). Identidade da linha é `date` + `hour`; diferente de
 * FollowerHistory, aqui as 3 colunas são obrigatórias (não há métrica
 * "opcional" nesse formato).
 */

export interface InstagramAudienceActivityParsedRecord extends InstagramAudienceParsedRecord {
  kind: "audience_activity";
  sourceRecord: { day: number; month: number; hour: number; activeFollowers: number };
}

export function matchesAudienceActivityHeaders(headers: readonly string[]): boolean {
  return matchColumns(INSTAGRAM_AUDIENCE_ACTIVITY_SCHEMA, headers).missingRequired.length === 0;
}

export function parseAudienceActivityRows(params: {
  rows: readonly string[][];
  fileId: string;
}): ParseResult<InstagramAudienceActivityParsedRecord> {
  const [headers, ...dataRows] = params.rows;
  if (!headers) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-activity-empty",
          message: "O relatório de FollowerActivity do Instagram está vazio.",
        },
      ],
    };
  }

  const match = matchColumns(INSTAGRAM_AUDIENCE_ACTIVITY_SCHEMA, headers);
  if (match.missingRequired.length > 0) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-activity-missing-headers",
          message: `O relatório de FollowerActivity não possui as colunas obrigatórias: ${match.missingRequired.join(", ")}.`,
        },
      ],
    };
  }

  const issues: ImportIssue[] = [];
  const records: InstagramAudienceActivityParsedRecord[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const dateValue = getColumnValue(row, match, "date") ?? "";
    const dayMonth = parsePtBrDayMonth(dateValue);
    const hour = parseAudienceNumber(getColumnValue(row, match, "hour"));
    const activeFollowers = parseAudienceNumber(getColumnValue(row, match, "activeFollowers"));

    if (!dayMonth || hour === null || hour < 0 || hour > 23 || activeFollowers === null) {
      issues.push({
        stage: "parse",
        code: "instagram-audience-activity-invalid-row",
        message: `Linha ${rowNumber} ignorada: data, hora ou seguidores ativos inválidos.`,
        row: rowNumber,
      });
      return;
    }

    records.push({
      platform: "instagram",
      kind: "audience_activity",
      fileId: params.fileId,
      row: rowNumber,
      sourceRecord: { ...dayMonth, hour, activeFollowers },
    });
  });

  return { records, issues };
}

export function normalizeAudienceActivityRecords(params: {
  records: readonly InstagramAudienceActivityParsedRecord[];
  batch: ImportBatch;
  referenceDate?: Date;
}): NormalizeResult<InstagramAudienceNormalizedRecord> {
  const isoDates = resolveYearForSequentialDates(
    params.records.map((record) => ({ day: record.sourceRecord.day, month: record.sourceRecord.month })),
    params.referenceDate
  );

  const records = params.records.map((record, index) => ({
    platform: "instagram" as const,
    entityType: "audience_metric" as const,
    payload: {
      datasetKind: "audience_activity" as const,
      date: isoDates[index],
      hour: record.sourceRecord.hour,
      activeFollowers: record.sourceRecord.activeFollowers,
    } satisfies InstagramAudienceActivityPayload,
    source: { batchId: params.batch.id, fileId: record.fileId, row: record.row },
  }));

  return { records, issues: [] };
}
