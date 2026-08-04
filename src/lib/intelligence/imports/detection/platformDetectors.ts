import type {
  DetectionResult,
  ImportDetectionInput,
  ImportPlatform,
  TikTokDatasetKind,
} from "@/lib/intelligence/imports/types";
import {
  countMatches,
  getDetectionHeaders,
  getDetectionHaystack,
  inferFileFormat,
  normalizeDetectionText,
} from "@/lib/intelligence/imports/detection/utils";
import { createCanonicalColumnDetector } from "@/lib/intelligence/imports/detection/canonicalColumnDetector";
import { YOUTUBE_COLUMN_SCHEMA } from "@/lib/intelligence/imports/platforms/youtube/columns";
import {
  INSTAGRAM_AUDIENCE_ACTIVITY_SCHEMA,
  INSTAGRAM_AUDIENCE_DEMOGRAPHICS_SCHEMA,
  INSTAGRAM_AUDIENCE_HISTORY_SCHEMA,
  INSTAGRAM_AUDIENCE_TERRITORY_SCHEMA,
} from "@/lib/intelligence/imports/platforms/instagram/columns";
import { TIKTOK_PROMOTIONS_COLUMN_SCHEMA } from "@/lib/intelligence/imports/platforms/tiktok/columns";
import type { PlatformDetectionScore, PlatformFileDetector } from "@/lib/intelligence/imports/detection/types";

export type { PlatformDetectionScore, PlatformFileDetector } from "@/lib/intelligence/imports/detection/types";

interface PlatformDetectorConfig {
  platform: ImportPlatform;
  datasetKind?: TikTokDatasetKind;
  fileNameHints: readonly string[];
  headerHints: readonly string[];
  contentHints: readonly string[];
}

const CONFIDENCE_BY_SIGNAL = {
  fileName: 0.24,
  header: 0.52,
  content: 0.34,
  format: 0.08,
} as const;

function scorePlatform(input: ImportDetectionInput, config: PlatformDetectorConfig): PlatformDetectionScore {
  const format = inferFileFormat(input.file);
  const fileName = normalizeDetectionText(input.file.name);
  const headers = getDetectionHeaders(input).map(normalizeDetectionText);
  const headerText = headers.join(" ");
  const haystack = getDetectionHaystack(input);

  const fileNameMatches = countMatches(fileName, config.fileNameHints);
  const headerMatches = countMatches(headerText, config.headerHints);
  const contentMatches = countMatches(haystack, config.contentHints);
  const supportedFormat = format !== "unknown";

  const confidence = Math.min(
    1,
    fileNameMatches * CONFIDENCE_BY_SIGNAL.fileName +
      headerMatches * CONFIDENCE_BY_SIGNAL.header +
      contentMatches * CONFIDENCE_BY_SIGNAL.content +
      (supportedFormat ? CONFIDENCE_BY_SIGNAL.format : 0)
  );

  const reasons = [
    fileNameMatches > 0 ? "nome do arquivo" : undefined,
    headerMatches > 0 ? "cabeçalhos" : undefined,
    contentMatches > 0 ? "primeiras linhas" : undefined,
    supportedFormat ? "extensão/formato" : undefined,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    platform: config.platform,
    ...(config.datasetKind ? { datasetKind: config.datasetKind } : {}),
    format,
    confidence,
    reasons,
  };
}

function createPlatformDetector(config: PlatformDetectorConfig): PlatformFileDetector {
  return {
    platform: config.platform,
    ...(config.datasetKind ? { datasetKind: config.datasetKind } : {}),
    score(input) {
      return scorePlatform(input, config);
    },
  };
}

/**
 * Detector do YouTube — padrão oficial de detecção do Intelligence
 * (`createCanonicalColumnDetector`, ver `docs/intelligence/IMPORTS.md`).
 * Consome o MESMO schema (`YOUTUBE_COLUMN_SCHEMA`) que
 * `platforms/youtube/parser.ts` usa para resolver as colunas de verdade —
 * detector e parser nunca podem divergir sobre o que é uma coluna do
 * YouTube. Suportar um idioma novo é só acrescentar um alias em
 * `platforms/youtube/columns.ts`; nenhuma linha deste arquivo muda.
 *
 * TikTok/Meta Ads ainda usam o detector genérico por palavras-chave
 * (`createPlatformDetector`) porque ainda não têm parser nem `columns.ts`
 * próprios — quando a vez de cada um chegar, o padrão a seguir é o do
 * YouTube, não este. O Instagram já tem os dois: `instagramDetector`
 * (legado, só para o relatório de Reels, que ainda não tem parser) e os 4
 * detectores canônicos de audiência mais abaixo (que têm parser completo,
 * ver `platforms/instagram/audienceParser.ts`).
 */
export const youtubeDetector: PlatformFileDetector = createCanonicalColumnDetector({
  platform: "youtube",
  schema: YOUTUBE_COLUMN_SCHEMA,
  brandHints: ["youtube", "yt", "studio", "channel"],
});

export const instagramDetector = createPlatformDetector({
  platform: "instagram",
  fileNameHints: ["instagram", "ig", "reels", "insights"],
  headerHints: ["reel", "post", "reach", "accounts reached", "likes", "saves", "shares"],
  contentHints: ["instagram", "reels", "accounts reached", "profile visits"],
});

/**
 * Detectores de audiência do Instagram (FollowerHistory, FollowerActivity,
 * FollowerGender, FollowerTopTerritories) — padrão oficial de colunas
 * canônicas, mesmo tratamento do YouTube, e não do `instagramDetector`
 * legado acima (que continua servindo só o relatório de Reels, ainda sem
 * parser próprio). `PlatformFileDetector.platform` não tem restrição de
 * unicidade (`detection/types.ts`), então múltiplos detectores podem
 * compartilhar `platform: "instagram"` sem conflito — o
 * `IntelligenceFileDetector` pontua todos e escolhe o de maior confiança.
 */
export const instagramAudienceHistoryDetector: PlatformFileDetector = createCanonicalColumnDetector({
  platform: "instagram",
  schema: INSTAGRAM_AUDIENCE_HISTORY_SCHEMA,
  brandHints: ["instagram", "followerhistory", "seguidores"],
});

export const instagramAudienceActivityDetector: PlatformFileDetector = createCanonicalColumnDetector({
  platform: "instagram",
  schema: INSTAGRAM_AUDIENCE_ACTIVITY_SCHEMA,
  brandHints: ["instagram", "followeractivity", "seguidores ativos"],
});

export const instagramAudienceDemographicsDetector: PlatformFileDetector = createCanonicalColumnDetector({
  platform: "instagram",
  schema: INSTAGRAM_AUDIENCE_DEMOGRAPHICS_SCHEMA,
  brandHints: ["instagram", "followergender", "genero"],
});

export const instagramAudienceTerritoryDetector: PlatformFileDetector = createCanonicalColumnDetector({
  platform: "instagram",
  schema: INSTAGRAM_AUDIENCE_TERRITORY_SCHEMA,
  brandHints: ["instagram", "followertopterritories", "territorios"],
});

export const tiktokDetector = createPlatformDetector({
  platform: "tiktok",
  datasetKind: "tiktok_creator",
  fileNameHints: ["tiktok", "tt", "creator"],
  headerHints: ["video views", "total play time", "average watch time", "traffic source", "new followers"],
  contentHints: ["tiktok", "creator center", "video views", "total play time"],
});

export const tiktokPromotionsDetector: PlatformFileDetector = createCanonicalColumnDetector({
  platform: "tiktok",
  datasetKind: "tiktok_promotions",
  schema: TIKTOK_PROMOTIONS_COLUMN_SCHEMA,
  brandHints: ["tiktok", "promotions", "promotion", "promoções"],
});

export const metaAdsDetector = createPlatformDetector({
  platform: "meta_ads",
  fileNameHints: ["meta ads", "facebook ads", "ads manager", "campanhas", "campaigns"],
  headerHints: ["campaign name", "ad set name", "amount spent", "impressions", "cpm", "ctr"],
  contentHints: ["meta ads", "facebook ads", "ads manager", "campaign name", "amount spent"],
});

export const DEFAULT_PLATFORM_DETECTORS = [
  youtubeDetector,
  instagramDetector,
  instagramAudienceHistoryDetector,
  instagramAudienceActivityDetector,
  instagramAudienceDemographicsDetector,
  instagramAudienceTerritoryDetector,
  tiktokPromotionsDetector,
  tiktokDetector,
  metaAdsDetector,
] as const;

export function detectionScoreToResult(score: PlatformDetectionScore): DetectionResult {
  return {
    platform: score.platform,
    ...(score.datasetKind ? { datasetKind: score.datasetKind } : {}),
    format: score.format,
    confidence: Number(score.confidence.toFixed(2)),
    issues: [],
  };
}
