import type { ImporterDefinition } from "@/lib/intelligence/imports/contracts";
import { getColumnValue, matchColumns } from "@/lib/intelligence/imports/columns";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";
import {
  TIKTOK_PROMOTIONS_COLUMN_SCHEMA,
  type TikTokPromotionsCanonicalColumn,
} from "@/lib/intelligence/imports/platforms/tiktok/columns";
import type {
  ImportBatch,
  NormalizeResult,
  NormalizedImportRecord,
  ParseResult,
  ParsedImportRecord,
  ParserInput,
} from "@/lib/intelligence/imports/types";

export type TikTokPromotionMetricKey = "promo:adCostBrl" | "promo:views" | "promo:newFollowers";

export interface TikTokPromotionSourceRecord {
  adCostBrl: number;
  videoViews: number;
  newFollowers: number;
  measuredAt: string;
  videoTitle?: string;
}

export interface TikTokPromotionParsedRecord extends ParsedImportRecord<"tiktok"> {
  fileId: string;
  sourceRecord: TikTokPromotionSourceRecord;
}

export interface TikTokPromotionMetricPayload extends Record<string, unknown> {
  source: "tiktok_promotions";
  measuredAt: string;
  title?: string;
  metrics: Record<TikTokPromotionMetricKey, number>;
}

export type TikTokPromotionNormalizedRecord = NormalizedImportRecord<
  "tiktok",
  TikTokPromotionMetricPayload
>;

type TikTokPromotionsParser = PlatformParserContract<"tiktok", TikTokPromotionParsedRecord>;

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

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;

  let normalized = value.replace(/R\$/gi, "").replace(/\s/g, "");
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");

  if (comma >= 0 && dot >= 0) {
    normalized =
      comma > dot
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (comma >= 0) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function normalizedDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function metric(
  row: readonly string[],
  match: ReturnType<typeof matchColumns<TikTokPromotionsCanonicalColumn>>,
  column: "adCostBrl" | "videoViews" | "newFollowers"
): number | null {
  return parseNumber(getColumnValue(row, match, column));
}

export const tiktokPromotionsParser: TikTokPromotionsParser = {
  platform: "tiktok",
  async parse(input: ParserInput): Promise<ParseResult<TikTokPromotionParsedRecord>> {
    if (input.platform !== "tiktok") {
      return {
        records: [],
        issues: [{
          stage: "parse",
          code: "tiktok-promotions-platform-mismatch",
          message: "O parser de promoções do TikTok recebeu um arquivo de outra plataforma.",
        }],
      };
    }

    if (typeof input.payload !== "string") {
      return {
        records: [],
        issues: [{
          stage: "parse",
          code: "tiktok-promotions-payload-not-text",
          message: "O histórico de promoções do TikTok deve ser recebido como texto CSV.",
        }],
      };
    }

    const [headers, ...dataRows] = parseCsv(input.payload);
    if (!headers) {
      return {
        records: [],
        issues: [{
          stage: "parse",
          code: "tiktok-promotions-empty-csv",
          message: "O histórico de promoções do TikTok está vazio.",
        }],
      };
    }

    const match = matchColumns(TIKTOK_PROMOTIONS_COLUMN_SCHEMA, headers);
    if (match.missingRequired.length > 0) {
      return {
        records: [],
        issues: [{
          stage: "parse",
          code: "tiktok-promotions-missing-headers",
          message: `O histórico de promoções não possui as colunas obrigatórias: ${match.missingRequired.join(", ")}.`,
        }],
      };
    }

    const issues: ParseResult<TikTokPromotionParsedRecord>["issues"] = [];
    const records = dataRows.flatMap((row, index) => {
      const rowNumber = index + 2;
      const adCostBrl = metric(row, match, "adCostBrl");
      const videoViews = metric(row, match, "videoViews");
      const newFollowers = metric(row, match, "newFollowers");
      const measuredAt = normalizedDate(getColumnValue(row, match, "measuredAt"));

      if (
        adCostBrl === null ||
        videoViews === null ||
        newFollowers === null ||
        !measuredAt
      ) {
        issues.push({
          stage: "parse",
          code: "tiktok-promotions-invalid-row",
          message: "Linha ignorada por conter data, custo, views ou seguidores inválidos.",
          row: rowNumber,
        });
        return [];
      }

      const videoTitle = getColumnValue(row, match, "videoTitle") || undefined;

      return [{
        platform: "tiktok" as const,
        fileId: input.file.id,
        row: rowNumber,
        sourceRecord: { adCostBrl, videoViews, newFollowers, measuredAt, videoTitle },
      }];
    });

    return { records, issues };
  },
};

export const tiktokPromotionsNormalizer = {
  platform: "tiktok" as const,
  async normalize(
    records: TikTokPromotionParsedRecord[],
    batch: ImportBatch
  ): Promise<NormalizeResult<TikTokPromotionNormalizedRecord>> {
    return {
      records: records.map((record) => ({
        platform: "tiktok",
        entityType: "campaign_metric",
        payload: {
          source: "tiktok_promotions",
          measuredAt: record.sourceRecord.measuredAt,
          title: record.sourceRecord.videoTitle,
          metrics: {
            "promo:adCostBrl": record.sourceRecord.adCostBrl,
            "promo:views": record.sourceRecord.videoViews,
            "promo:newFollowers": record.sourceRecord.newFollowers,
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

export const tiktokPromotionsImporter = {
  platform: "tiktok",
  parser: tiktokPromotionsParser,
  normalizer: tiktokPromotionsNormalizer,
} satisfies ImporterDefinition<TikTokPromotionParsedRecord, TikTokPromotionNormalizedRecord>;

export async function normalizeTikTokPromotionsCsv(params: {
  batch: ImportBatch;
  input: ParserInput;
}): Promise<NormalizeResult<TikTokPromotionNormalizedRecord>> {
  const parsed = await tiktokPromotionsParser.parse(params.input);
  const normalized = await tiktokPromotionsNormalizer.normalize(parsed.records, params.batch);
  return { records: normalized.records, issues: [...parsed.issues, ...normalized.issues] };
}
