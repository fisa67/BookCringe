import type { ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";

export type ImportValidationCheckKey = "file" | "platform" | "structure" | "metrics";

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
};

function buildCheck(key: ImportValidationCheckKey, passed: boolean, message: string): ImportValidationCheck {
  return { key, label: CHECK_LABELS[key], passed, message };
}

/**
 * Deriva os 4 critérios de Validação a partir do resultado que a Detection
 * Preview (`previewImportFile`) já calculou — não chama o detector nem o
 * parser de novo, é uma leitura pura do resultado existente sob a ótica de
 * "está pronto para importar?".
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
        ? `O adapter de ${platformLabel(result.platform)} ainda não foi implementado — por enquanto, só o YouTube tem suporte completo.`
        : "A estrutura do arquivo não corresponde ao formato esperado pelo importador."
  );

  const recordCount = result.status === "ready" ? result.preview.videoCount : 0;
  const metricsFound = result.status === "ready" ? result.preview.metrics.length : 0;
  const metricsOk = result.status === "ready" && recordCount > 0 && metricsFound > 0;
  const metricsCheck = buildCheck(
    "metrics",
    metricsOk,
    metricsOk
      ? `${recordCount} registro(s) e ${metricsFound} métrica(s) identificadas.`
      : "Nenhuma métrica pôde ser extraída deste arquivo."
  );

  const checks = [fileCheck, platformCheck, structureCheck, metricsCheck];

  return { isValid: checks.every((item) => item.passed), checks };
}
