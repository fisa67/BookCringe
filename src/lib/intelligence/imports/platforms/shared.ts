import type { ImportPlatform, ParsedImportRecord } from "@/lib/intelligence/imports/types";
import type { PlatformParser } from "@/lib/intelligence/imports/contracts";

export type PlatformParserContract<
  TPlatform extends ImportPlatform,
  TRecord extends ParsedImportRecord<TPlatform>,
> = PlatformParser<TRecord> & {
  readonly platform: TPlatform;
};
