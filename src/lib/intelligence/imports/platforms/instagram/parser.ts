import type { ParsedImportRecord } from "@/lib/intelligence/imports/types";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";

export interface InstagramParsedRecord extends ParsedImportRecord<"instagram"> {
  sourceRecord: Record<string, unknown>;
}

export type InstagramParser = PlatformParserContract<"instagram", InstagramParsedRecord>;
