import type { ParsedImportRecord } from "@/lib/intelligence/imports/types";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";

export interface GoogleAnalyticsParsedRecord extends ParsedImportRecord<"google_analytics"> {
  sourceRecord: Record<string, unknown>;
}

export type GoogleAnalyticsParser = PlatformParserContract<
  "google_analytics",
  GoogleAnalyticsParsedRecord
>;
