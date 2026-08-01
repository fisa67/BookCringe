import type {
  DetectionResult,
  ImportBatch,
  ImportDetectionInput,
  ImportPlatform,
  NormalizeResult,
  NormalizedImportRecord,
  ParseResult,
  ParsedImportRecord,
  ParserInput,
  PersistenceReceipt,
} from "@/lib/intelligence/imports/types";

export interface ImportDetector {
  detect(input: ImportDetectionInput): Promise<DetectionResult>;
}

export interface PlatformParser<TRecord extends ParsedImportRecord = ParsedImportRecord> {
  readonly platform: ImportPlatform;
  parse(input: ParserInput): Promise<ParseResult<TRecord>>;
}

export interface ImportNormalizer<
  TParsedRecord extends ParsedImportRecord = ParsedImportRecord,
  TNormalizedRecord extends NormalizedImportRecord = NormalizedImportRecord,
> {
  readonly platform: TParsedRecord["platform"];
  normalize(records: TParsedRecord[], batch: ImportBatch): Promise<NormalizeResult<TNormalizedRecord>>;
}

export interface ImportPersistence<TRecord extends NormalizedImportRecord = NormalizedImportRecord> {
  persist(records: TRecord[], batch: ImportBatch): Promise<PersistenceReceipt>;
}

export interface ImporterDefinition<
  TParsedRecord extends ParsedImportRecord = ParsedImportRecord,
  TNormalizedRecord extends NormalizedImportRecord = NormalizedImportRecord,
> {
  readonly platform: TParsedRecord["platform"];
  readonly parser: PlatformParser<TParsedRecord>;
  readonly normalizer: ImportNormalizer<TParsedRecord, TNormalizedRecord>;
}

export interface ImportPipelineDefinition<
  TParsedRecord extends ParsedImportRecord = ParsedImportRecord,
  TNormalizedRecord extends NormalizedImportRecord = NormalizedImportRecord,
> {
  readonly detector: ImportDetector;
  readonly importers: readonly ImporterDefinition<TParsedRecord, TNormalizedRecord>[];
  readonly persistence: ImportPersistence<TNormalizedRecord>;
}
