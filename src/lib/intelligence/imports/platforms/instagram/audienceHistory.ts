import type { ImportBatch, ImportIssue, NormalizeResult, ParseResult } from "@/lib/intelligence/imports/types";
import { getColumnValue, matchColumns } from "@/lib/intelligence/imports/columns";
import { INSTAGRAM_AUDIENCE_HISTORY_SCHEMA } from "@/lib/intelligence/imports/platforms/instagram/columns";
import { parsePtBrDayMonth, resolveYearForSequentialDates } from "@/lib/intelligence/imports/platforms/instagram/audienceDate";
import { parseAudienceNumber } from "@/lib/intelligence/imports/platforms/instagram/audienceNumber";
import type {
  InstagramAudienceHistoryPayload,
  InstagramAudienceNormalizedRecord,
  InstagramAudienceParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

/**
 * `FollowerHistory` do Instagram — série diária de total de seguidores.
 * Identidade da linha é a data; `followersDelta` é opcional (degrada para
 * `0`, mesma tolerância que o YouTube já usa para métricas ausentes).
 */

export interface InstagramAudienceHistoryParsedRecord extends InstagramAudienceParsedRecord {
  kind: "audience_history";
  sourceRecord: { day: number; month: number; followers: number; followersDelta: number };
}

export function matchesAudienceHistoryHeaders(headers: readonly string[]): boolean {
  return matchColumns(INSTAGRAM_AUDIENCE_HISTORY_SCHEMA, headers).missingRequired.length === 0;
}

export function parseAudienceHistoryRows(params: {
  rows: readonly string[][];
  fileId: string;
}): ParseResult<InstagramAudienceHistoryParsedRecord> {
  const [headers, ...dataRows] = params.rows;
  if (!headers) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-history-empty",
          message: "O relatório de FollowerHistory do Instagram está vazio.",
        },
      ],
    };
  }

  const match = matchColumns(INSTAGRAM_AUDIENCE_HISTORY_SCHEMA, headers);
  if (match.missingRequired.length > 0) {
    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-history-missing-headers",
          message: `O relatório de FollowerHistory não possui as colunas obrigatórias: ${match.missingRequired.join(", ")}.`,
        },
      ],
    };
  }

  const issues: ImportIssue[] = [];
  const records: InstagramAudienceHistoryParsedRecord[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const dateValue = getColumnValue(row, match, "date") ?? "";
    const dayMonth = parsePtBrDayMonth(dateValue);
    if (!dayMonth) {
      issues.push({
        stage: "parse",
        code: "instagram-audience-history-invalid-date",
        message: `Linha ${rowNumber} ignorada: data "${dateValue}" não reconhecida.`,
        row: rowNumber,
      });
      return;
    }

    const followers = parseAudienceNumber(getColumnValue(row, match, "followers"));
    if (followers === null) {
      issues.push({
        stage: "parse",
        code: "instagram-audience-history-invalid-followers",
        message: `Linha ${rowNumber} ignorada: valor de Followers inválido.`,
        row: rowNumber,
      });
      return;
    }

    const followersDelta = parseAudienceNumber(getColumnValue(row, match, "followersDelta")) ?? 0;

    records.push({
      platform: "instagram",
      kind: "audience_history",
      fileId: params.fileId,
      row: rowNumber,
      sourceRecord: { ...dayMonth, followers, followersDelta },
    });
  });

  return { records, issues };
}

export function normalizeAudienceHistoryRecords(params: {
  records: readonly InstagramAudienceHistoryParsedRecord[];
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
      datasetKind: "audience_history" as const,
      date: isoDates[index],
      followers: record.sourceRecord.followers,
      followersDelta: record.sourceRecord.followersDelta,
    } satisfies InstagramAudienceHistoryPayload,
    source: { batchId: params.batch.id, fileId: record.fileId, row: record.row },
  }));

  return { records, issues: [] };
}
