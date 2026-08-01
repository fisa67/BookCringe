import type { ParsedImportRecord } from "@/lib/intelligence/imports/types";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";

export interface TikTokParsedRecord extends ParsedImportRecord<"tiktok"> {
  sourceRecord: Record<string, unknown>;
}

export type TikTokParser = PlatformParserContract<"tiktok", TikTokParsedRecord>;
