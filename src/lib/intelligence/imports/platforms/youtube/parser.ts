import type {
  ImportBatch,
  NormalizeResult,
  NormalizedImportRecord,
  ParseResult,
  ParsedImportRecord,
  ParserInput,
} from "@/lib/intelligence/imports/types";
import type { ImporterDefinition } from "@/lib/intelligence/imports/contracts";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";
import { getColumnValue, matchColumns, type ColumnMatch } from "@/lib/intelligence/imports/columns";
import {
  YOUTUBE_COLUMN_SCHEMA,
  type YouTubeCanonicalColumn,
} from "@/lib/intelligence/imports/platforms/youtube/columns";

export interface YouTubeStudioSourceRecord {
  videoTitle: string;
  videoPublishTime: string;
  views: number;
  watchTimeHours: number;
  impressions: number;
  subscribers: number;
}

export interface YouTubeParsedRecord extends ParsedImportRecord<"youtube"> {
  fileId: string;
  sourceRecord: YouTubeStudioSourceRecord;
}

export type YouTubeParser = PlatformParserContract<"youtube", YouTubeParsedRecord>;

export interface YouTubeStudioMetricPayload extends Record<string, unknown> {
  source: "youtube_studio";
  title: string;
  publishedAt: string;
  metrics: {
    views: number;
    watchTimeHours: number;
    impressions: number;
    subscribers: number;
  };
}

export type YouTubeNormalizedRecord = NormalizedImportRecord<"youtube", YouTubeStudioMetricPayload>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Métricas são colunas opcionais do schema (`YOUTUBE_COLUMN_SCHEMA`):
 * coluna ausente do export ou célula vazia/inválida sempre resulta em 0,
 * nunca invalida a linha — só `videoTitle`/`videoPublishTime` ausentes
 * fazem isso (ver a validação de identidade dentro de `parse` abaixo).
 */
function getMetric(row: readonly string[], match: ColumnMatch<YouTubeCanonicalColumn>, column: YouTubeCanonicalColumn): number {
  const value = getColumnValue(row, match, column);
  if (value === undefined) return 0;
  return parseNumber(value) ?? 0;
}

export const youtubeStudioParser: YouTubeParser = {
  platform: "youtube",
  async parse(input: ParserInput): Promise<ParseResult<YouTubeParsedRecord>> {
    if (input.platform !== "youtube") {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "youtube-platform-mismatch",
            message: "O parser do YouTube recebeu um arquivo de outra plataforma.",
          },
        ],
      };
    }

    if (typeof input.payload !== "string") {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "youtube-payload-not-text",
            message: "O relatório do YouTube Studio deve ser recebido como texto CSV.",
          },
        ],
      };
    }

    const rows = parseCsv(input.payload);
    const [headers, ...dataRows] = rows;
    if (!headers) {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "youtube-empty-csv",
            message: "O relatório do YouTube Studio está vazio.",
          },
        ],
      };
    }

    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, headers);
    if (match.missingRequired.length > 0) {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "youtube-missing-headers",
            message: `O relatório do YouTube Studio não possui as colunas obrigatórias: ${match.missingRequired.join(", ")}.`,
          },
        ],
      };
    }

    const issues: ParseResult<YouTubeParsedRecord>["issues"] = [];
    const records = dataRows.flatMap((row, index) => {
      const rowNumber = index + 2;
      const videoTitle = getColumnValue(row, match, "videoTitle") ?? "";
      const videoPublishTime = getColumnValue(row, match, "videoPublishTime") ?? "";

      if (!videoTitle && !videoPublishTime) {
        // Linha agregada (ex.: "Total" do Table data.csv) — sem
        // identidade de vídeo, é esperada e ignorada silenciosamente,
        // não é um erro de parse.
        return [];
      }

      if (!videoTitle || !videoPublishTime) {
        issues.push({
          stage: "parse",
          code: "youtube-invalid-row",
          message: "Linha ignorada por não ter título e horário de publicação do vídeo.",
          row: rowNumber,
        });
        return [];
      }

      return [
        {
          platform: "youtube" as const,
          fileId: input.file.id,
          row: rowNumber,
          sourceRecord: {
            videoTitle,
            videoPublishTime,
            views: getMetric(row, match, "views"),
            watchTimeHours: getMetric(row, match, "watchTimeHours"),
            impressions: getMetric(row, match, "impressions"),
            subscribers: getMetric(row, match, "subscribers"),
          },
        },
      ];
    });

    return { records, issues };
  },
};

export const youtubeStudioNormalizer = {
  platform: "youtube" as const,
  async normalize(
    records: YouTubeParsedRecord[],
    batch: ImportBatch
  ): Promise<NormalizeResult<YouTubeNormalizedRecord>> {
    return {
      records: records.map((record) => ({
        platform: "youtube",
        entityType: "platform_metric",
        payload: {
          source: "youtube_studio",
          title: record.sourceRecord.videoTitle,
          publishedAt: record.sourceRecord.videoPublishTime,
          metrics: {
            views: record.sourceRecord.views,
            watchTimeHours: record.sourceRecord.watchTimeHours,
            impressions: record.sourceRecord.impressions,
            subscribers: record.sourceRecord.subscribers,
          },
        },
        source: {
          batchId: batch.id,
          fileId: record.fileId,
          row: record.row,
        },
      })),
      issues: [],
    };
  },
};

export const youtubeStudioImporter = {
  platform: "youtube",
  parser: youtubeStudioParser,
  normalizer: youtubeStudioNormalizer,
} satisfies ImporterDefinition<YouTubeParsedRecord, YouTubeNormalizedRecord>;

export async function normalizeYouTubeStudioCsv(params: {
  batch: ImportBatch;
  input: ParserInput;
}): Promise<NormalizeResult<YouTubeNormalizedRecord>> {
  const parseResult = await youtubeStudioParser.parse(params.input);
  const normalizeResult = await youtubeStudioNormalizer.normalize(parseResult.records, params.batch);

  return {
    records: normalizeResult.records,
    issues: [...parseResult.issues, ...normalizeResult.issues],
  };
}
