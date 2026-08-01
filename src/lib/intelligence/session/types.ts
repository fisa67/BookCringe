import type { ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import type { ImportPlatform, PersistenceReceipt } from "@/lib/intelligence/imports/types";
import type { ImportValidationResult } from "@/lib/intelligence/session/validation";

/**
 * Import Session — estado do fluxo de importação do ponto de vista do
 * usuário: arquivo selecionado → Detection Preview → Validação → pronto
 * para importar → importado. Vive inteiramente em memória, no cliente
 * (`useImportSession`).
 *
 * Não confundir com a entidade canônica `Import` (`src/lib/intelligence/model.ts`)
 * nem com `ImportBatch` (`imports/types.ts`): a Import Session é só a
 * experiência de UI enquanto o usuário passa pelas etapas. Quando a sessão
 * chega a "ready" e o usuário confirma, `importResult` guarda o
 * `PersistenceReceipt` do `Import` de verdade que acabou de ser gravado.
 */

export type ImportSessionStage =
  | "idle"
  | "detecting"
  | "validating"
  | "ready"
  | "blocked"
  | "error"
  | "importing"
  | "imported"
  | "import_error";

export interface ImportSessionFile {
  name: string;
  size: number;
}

export interface ImportSessionMetric {
  key: string;
  label: string;
  total: number;
}

/** Recorte da Detection Preview no formato que a sessão guarda. */
export interface ImportSessionSummary {
  platform: ImportPlatform | null;
  confidence: number | null;
  period: { start: string; end: string } | null;
  recordCount: number | null;
  metrics: ImportSessionMetric[];
}

export interface ImportSession {
  stage: ImportSessionStage;
  file: ImportSessionFile | null;
  preview: ImportPreviewResult | null;
  summary: ImportSessionSummary;
  validation: ImportValidationResult | null;
  errorMessage: string | null;
  /** Resultado da gravação real, preenchido só depois que o usuário confirma o Importar. */
  importResult: PersistenceReceipt | null;
}

export const EMPTY_IMPORT_SESSION_SUMMARY: ImportSessionSummary = {
  platform: null,
  confidence: null,
  period: null,
  recordCount: null,
  metrics: [],
};

export const EMPTY_IMPORT_SESSION: ImportSession = {
  stage: "idle",
  file: null,
  preview: null,
  summary: EMPTY_IMPORT_SESSION_SUMMARY,
  validation: null,
  errorMessage: null,
  importResult: null,
};
