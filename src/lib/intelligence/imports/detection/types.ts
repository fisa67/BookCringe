import type {
  ImportDetectionInput,
  ImportFileFormat,
  ImportPlatform,
  TikTokDatasetKind,
} from "@/lib/intelligence/imports/types";

/**
 * Tipos compartilhados entre `platformDetectors.ts` (registro de todos os
 * detectores) e `canonicalColumnDetector.ts` (fábrica baseada em colunas
 * canônicas) — isolados num arquivo próprio, sem lógica, para os dois
 * poderem se importar sem criar um ciclo.
 */

export interface PlatformDetectionScore {
  platform: ImportPlatform;
  datasetKind?: TikTokDatasetKind;
  format: ImportFileFormat;
  confidence: number;
  reasons: string[];
}

export interface PlatformFileDetector {
  readonly platform: ImportPlatform;
  readonly datasetKind?: TikTokDatasetKind;
  score(input: ImportDetectionInput): PlatformDetectionScore;
}
