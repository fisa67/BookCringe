import type { ParsedImportRecord } from "@/lib/intelligence/imports/types";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";

export interface ManualParsedRecord extends ParsedImportRecord<"manual"> {
  sourceRecord: Record<string, unknown>;
}

export type ManualParser = PlatformParserContract<"manual", ManualParsedRecord>;
