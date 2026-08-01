/**
 * Tipos de PROCESSO do pipeline de importação — descrevem as etapas de
 * trazer um arquivo para dentro do sistema (detecção, parse, normalização).
 * São efêmeros: existem apenas durante uma execução do pipeline, nunca são
 * persistidos como estão.
 *
 * Não confundir com o modelo canônico do Intelligence (`Platform`,
 * `Dataset`, `Import`, `Content`, `Metric`, `Insight` — ver
 * `src/lib/intelligence/model.ts` e `docs/data-model.md`), que descreve o
 * que o sistema *sabe*, independente de qual plataforma originou o dado.
 * `NormalizedImportRecord` é a ponte entre as duas camadas: é o último tipo
 * de processo antes da Persistência mapear seus registros para `Content`/
 * `Metric` — seu campo `entityType` já é uma dica de para qual entidade
 * canônica cada registro se tornará.
 */

export type KnownImportPlatform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "meta_ads"
  | "google_analytics"
  | "manual";

export type ImportPlatform = KnownImportPlatform | (string & {});

export type ImportFileFormat = "csv" | "excel" | "pdf" | "json" | "unknown";

export type ImportPipelineStage =
  | "import"
  | "detect"
  | "parse"
  | "normalize"
  | "persist";

export type ImportStatus =
  | "pending"
  | "detected"
  | "parsed"
  | "normalized"
  | "persisted"
  | "failed";

export type NormalizedEntityType =
  | "content"
  | "platform_metric"
  | "campaign_metric"
  | "audience_metric"
  | "manual_entry";

export interface ImportFileDescriptor {
  id: string;
  name: string;
  size: number;
  mimeType?: string;
  extension?: string;
  format: ImportFileFormat;
}

export interface ImportIssue {
  stage: ImportPipelineStage;
  message: string;
  code?: string;
  row?: number;
  field?: string;
}

export interface ImportBatch {
  id: string;
  platform?: ImportPlatform;
  status: ImportStatus;
  files: ImportFileDescriptor[];
  createdAt: string;
}

export interface DetectionResult {
  platform: ImportPlatform;
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export interface ImportDetectionInput {
  file: ImportFileDescriptor;
  headers?: readonly string[];
  firstLines?: readonly string[];
  contentSample?: string;
}

export interface ParserInput {
  batchId: string;
  platform: ImportPlatform;
  file: ImportFileDescriptor;
  payload: unknown;
}

export interface ParsedImportRecord<TPlatform extends ImportPlatform = ImportPlatform> {
  platform: TPlatform;
  sourceRecord: unknown;
  row?: number;
}

export interface ParseResult<TRecord extends ParsedImportRecord = ParsedImportRecord> {
  records: TRecord[];
  issues: ImportIssue[];
}

export interface NormalizedImportRecord<
  TPlatform extends ImportPlatform = ImportPlatform,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  platform: TPlatform;
  entityType: NormalizedEntityType;
  payload: TPayload;
  source: {
    batchId: string;
    fileId: string;
    row?: number;
  };
}

export interface NormalizeResult<
  TRecord extends NormalizedImportRecord = NormalizedImportRecord,
> {
  records: TRecord[];
  issues: ImportIssue[];
}

export interface PersistenceReceipt {
  batchId: string;
  status: Extract<ImportStatus, "persisted" | "failed">;
  acceptedRecords: number;
  rejectedRecords: number;
  issues: ImportIssue[];
}
