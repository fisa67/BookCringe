import type { ImportDetectionInput, ImportPlatform } from "@/lib/intelligence/imports/types";
import { matchColumns, type CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";
import {
  countMatches,
  getDetectionHaystack,
  getDetectionHeaders,
  inferFileFormat,
  normalizeDetectionText,
} from "@/lib/intelligence/imports/detection/utils";
import type { PlatformDetectionScore, PlatformFileDetector } from "@/lib/intelligence/imports/detection/types";

export interface CanonicalColumnDetectorConfig<TColumn extends string> {
  platform: ImportPlatform;
  /** O MESMO schema (`platforms/<plataforma>/columns.ts`) que o parser da plataforma usa — nunca uma cópia. */
  schema: CanonicalColumnSchema<TColumn>;
  /**
   * Sinal de marca fraco e opcional (nome de arquivo comum, palavra da
   * plataforma que às vezes aparece no conteúdo) — dá só um empurrão
   * pequeno na confiança; a presença das colunas é sempre o sinal
   * dominante (ver pesos abaixo). Ex.: YouTube usa
   * `["youtube", "studio", "channel"]`.
   */
  brandHints?: readonly string[];
}

/**
 * Pesos do sinal "colunas canônicas", somando 1.0 no melhor caso (todas
 * as colunas obrigatórias e opcionais encontradas, arquivo com nome/
 * conteúdo reconhecível, formato suportado). De propósito, a maior parte
 * do peso (`required`) depende só da presença das colunas — nunca do
 * nome do arquivo — porque é o único sinal que não varia com o idioma da
 * conta nem com como a pessoa nomeou o arquivo ao salvar.
 */
const WEIGHTS = {
  required: 0.7,
  optional: 0.1,
  brand: 0.1,
  format: 0.1,
} as const;

/**
 * Fábrica de detectores baseados no padrão oficial de "colunas canônicas"
 * (`imports/columns.ts` + `docs/intelligence/IMPORTS.md`). Qualquer
 * plataforma nova (Instagram, TikTok, Meta Ads, Google Analytics, quando
 * chegar a vez — ver `AGENTS.md`) ganha seu detector chamando esta
 * função com o `CanonicalColumnSchema` do seu próprio
 * `platforms/<plataforma>/columns.ts`, sem escrever nenhuma lógica de
 * pontuação nova.
 *
 * A confiança é dominada por quantas colunas *obrigatórias* e *opcionais*
 * do schema foram encontradas nos cabeçalhos reais do arquivo — usando
 * `matchColumns` (igualdade exata normalizada, nunca substring solta, o
 * que evita colisão com palavras genéricas de outra plataforma). Nome de
 * arquivo e conteúdo são só um sinal de apoio menor.
 */
export function createCanonicalColumnDetector<TColumn extends string>(
  config: CanonicalColumnDetectorConfig<TColumn>
): PlatformFileDetector {
  const brandHints = config.brandHints ?? [];
  const requiredTotal = config.schema.required.length;
  const optionalTotal = config.schema.optional?.length ?? 0;

  return {
    platform: config.platform,
    score(input: ImportDetectionInput): PlatformDetectionScore {
      const format = inferFileFormat(input.file);
      const headers = getDetectionHeaders(input);
      const match = matchColumns(config.schema, headers);

      const requiredRatio = requiredTotal === 0 ? 0 : match.matchedRequired.length / requiredTotal;
      const optionalRatio = optionalTotal === 0 ? 0 : match.matchedOptional.length / optionalTotal;

      const fileName = normalizeDetectionText(input.file.name);
      const haystack = getDetectionHaystack(input);
      const hasBrandMatch = countMatches(fileName, brandHints) > 0 || countMatches(haystack, brandHints) > 0;
      const supportedFormat = format !== "unknown";

      const confidence = Math.min(
        1,
        requiredRatio * WEIGHTS.required +
          optionalRatio * WEIGHTS.optional +
          (hasBrandMatch ? WEIGHTS.brand : 0) +
          (supportedFormat ? WEIGHTS.format : 0)
      );

      const reasons = [
        match.matchedRequired.length > 0
          ? `colunas obrigatórias (${match.matchedRequired.length}/${requiredTotal})`
          : undefined,
        match.matchedOptional.length > 0
          ? `colunas opcionais (${match.matchedOptional.length}/${optionalTotal})`
          : undefined,
        hasBrandMatch ? "nome do arquivo/conteúdo" : undefined,
        supportedFormat ? "extensão/formato" : undefined,
      ].filter((reason): reason is string => Boolean(reason));

      return { platform: config.platform, format, confidence, reasons };
    },
  };
}
