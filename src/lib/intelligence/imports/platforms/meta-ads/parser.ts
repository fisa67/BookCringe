import type { ParsedImportRecord } from "@/lib/intelligence/imports/types";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";

export interface MetaAdsParsedRecord extends ParsedImportRecord<"meta_ads"> {
  sourceRecord: Record<string, unknown>;
}

export type MetaAdsParser = PlatformParserContract<"meta_ads", MetaAdsParsedRecord>;
