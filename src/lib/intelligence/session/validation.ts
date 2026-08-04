import type { ImportPreviewReady, ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import { PLATFORMS_WITH_PERSISTENCE } from "@/lib/intelligence/imports/platformCapabilities";

export type ImportValidationCheckKey = "file" | "platform" | "structure" | "metrics" | "persistence";

export interface ImportValidationCheck {
  key: ImportValidationCheckKey;
  label: string;
  passed: boolean;
  message: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  checks: ImportValidationCheck[];
}

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  meta_ads: "Meta Ads",
  google_analytics: "Google Analytics",
  manual: "Manual",
  unknown: "plataforma não identificada",
};

function platformLabel(platform: ImportPlatform): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

const CHECK_LABELS: Record<ImportValidationCheckKey, string> = {
  file: "Arquivo válido",
  platform: "Plataforma reconhecida",
  structure: "Estrutura compatível",
  metrics: "Métricas identificadas",
  persistence: "Persistência disponível",
};

function buildCheck(key: ImportValidationCheckKey, passed: boolean, message: string): ImportValidationCheck {
  return { key, label: CHECK_LABELS[key], passed, message };
}

/** Quantidade de registros da preview pronta — YouTube usa `videoCount`; Campaign/Audience usam `recordCount`. */
function readyRecordCount(result: ImportPreviewReady): number {
  return result.platform === "youtube" ? result.preview.videoCount : result.preview.recordCount;
}

/** "Métricas encontradas" da preview pronta — mesma ideia de `readyRecordCount`, um campo por adapter. */
function readyMetricsFound(result: ImportPreviewReady): number {
  return result.preview.metrics.length;
}

/**
 * Deriva os 5 critérios de Validação a partir do resultado que a Detection
 * Preview (`previewImportFile`) já calculou — não chama o detector nem o
 * parser de novo, é uma leitura pura do resultado existente sob a ótica de
 * "está pronto para importar?" (os 4 primeiros) e "dá pra confirmar de
 * verdade?" (o 5º, `persistence`).
 */
export function validateImportPreview(result: ImportPreviewResult): ImportValidationResult {
  const fileCheck = buildCheck("file", true, "O arquivo foi lido e processado com sucesso.");

  const platformRecognized = result.platform !== "unknown";
  const platformCheck = buildCheck(
    "platform",
    platformRecognized,
    platformRecognized
      ? `Identificado como ${platformLabel(result.platform)}.`
      : "Não conseguimos identificar de qual plataforma este arquivo veio."
  );

  const structureOk = result.status === "ready";
  const structureCheck = buildCheck(
    "structure",
    structureOk,
    structureOk
      ? "A estrutura do arquivo é compatível com o importador conectado."
      : result.status === "unsupported"
        ? `O adapter deste formato de ${platformLabel(result.platform)} ainda não foi implementado.`
        : "A estrutura do arquivo não corresponde ao formato esperado pelo importador."
  );

  const recordCount = result.status === "ready" ? readyRecordCount(result) : 0;
  const metricsFound = result.status === "ready" ? readyMetricsFound(result) : 0;
  const metricsOk = result.status === "ready" && recordCount > 0 && metricsFound > 0;
  const metricsCheck = buildCheck(
    "metrics",
    metricsOk,
    metricsOk
      ? `${recordCount} registro(s) e ${metricsFound} métrica(s) identificadas.`
      : "Nenhuma métrica pôde ser extraída deste arquivo."
  );

  /**
   * Depende de `PLATFORMS_WITH_PERSISTENCE` (o que já existe implementado)
   * *e* de `structureOk` — uma plataforma pode ter mais de um formato de
   * arquivo detectável sob o mesmo `platform` (ex.: Instagram tem Reels,
   * sem adapter, e Audiência, com persistência desde a Sprint 14); sem
   * checar `structureOk`, um CSV de Reels seria incorretamente marcado como
   * "persistência disponível" só por a plataforma "instagram" já ter
   * `persistence.ts` para outro formato. `platformRecognized` sozinho não
   * bastava por esse mesmo motivo.
   */
  const persistenceReady = structureOk && PLATFORMS_WITH_PERSISTENCE.includes(result.platform);
  const persistenceCheck = buildCheck(
    "persistence",
    persistenceReady,
    persistenceReady
      ? `A persistência para ${platformLabel(result.platform)} já está disponível.`
      : structureOk
        ? `A persistência para ${platformLabel(result.platform)} ainda não foi implementada — chega em uma sprint futura.`
        : "A estrutura do arquivo precisa ser reconhecida antes de confirmar a persistência."
  );

  const checks = [fileCheck, platformCheck, structureCheck, metricsCheck, persistenceCheck];

  return { isValid: checks.every((item) => item.passed), checks };
}
