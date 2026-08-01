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

const REQUIRED_HEADERS = [
  "Video title",
  "Video publish time",
  "Views",
  "Watch time (hours)",
  "Impressions",
  "Subscribers",
] as const;

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

function getRequiredHeaderIndexes(headers: string[]): Map<(typeof REQUIRED_HEADERS)[number], number> | null {
  const indexes = new Map<(typeof REQUIRED_HEADERS)[number], number>();

  for (const header of REQUIRED_HEADERS) {
    const index = headers.findIndex((value) => value === header);
    if (index === -1) return null;
    indexes.set(header, index);
  }

  return indexes;
}

function getValue(
  row: string[],
  indexes: Map<(typeof REQUIRED_HEADERS)[number], number>,
  header: (typeof REQUIRED_HEADERS)[number]
): string {
  return row[indexes.get(header) ?? -1] ?? "";
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

    const indexes = getRequiredHeaderIndexes(headers);
    if (!indexes) {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "youtube-missing-headers",
            message: "O relatório do YouTube Studio não possui todos os cabeçalhos esperados.",
          },
        ],
      };
    }

    const issues: ParseResult<YouTubeParsedRecord>["issues"] = [];
    const records = dataRows.flatMap((row, index) => {
      const rowNumber = index + 2;
      const views = parseNumber(getValue(row, indexes, "Views"));
      const watchTimeHours = parseNumber(getValue(row, indexes, "Watch time (hours)"));
      const impressions = parseNumber(getValue(row, indexes, "Impressions"));
      const subscribers = parseNumber(getValue(row, indexes, "Subscribers"));
      const videoTitle = getValue(row, indexes, "Video title");
      const videoPublishTime = getValue(row, indexes, "Video publish time");

      if (!videoTitle || !videoPublishTime || views === null || watchTimeHours === null || impressions === null || subscribers === null) {
        issues.push({
          stage: "parse",
          code: "youtube-invalid-row",
          message: "Linha ignorada por conter campos obrigatórios ausentes ou inválidos.",
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
            views,
            watchTimeHours,
            impressions,
            subscribers,
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
