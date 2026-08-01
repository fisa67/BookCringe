import type {
  DetectionResult,
  ImportDetectionInput,
  ImportFileFormat,
  ImportPlatform,
} from "@/lib/intelligence/imports/types";
import {
  countMatches,
  getDetectionHeaders,
  getDetectionHaystack,
  inferFileFormat,
  normalizeDetectionText,
} from "@/lib/intelligence/imports/detection/utils";

export interface PlatformDetectionScore {
  platform: ImportPlatform;
  format: ImportFileFormat;
  confidence: number;
  reasons: string[];
}

export interface PlatformFileDetector {
  readonly platform: ImportPlatform;
  score(input: ImportDetectionInput): PlatformDetectionScore;
}

interface PlatformDetectorConfig {
  platform: ImportPlatform;
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
    format,
    confidence,
    reasons,
  };
}

function createPlatformDetector(config: PlatformDetectorConfig): PlatformFileDetector {
  return {
    platform: config.platform,
    score(input) {
      return scorePlatform(input, config);
    },
  };
}

export const youtubeDetector = createPlatformDetector({
  platform: "youtube",
  fileNameHints: ["youtube", "yt", "studio", "channel"],
  headerHints: ["watch time (hours)", "impressions", "subscribers"],
  contentHints: ["youtube", "youtube studio", "channel", "watch time (hours)"],
});

export const instagramDetector = createPlatformDetector({
  platform: "instagram",
  fileNameHints: ["instagram", "ig", "reels", "insights"],
  headerHints: ["reel", "post", "reach", "accounts reached", "likes", "saves", "shares"],
  contentHints: ["instagram", "reels", "accounts reached", "profile visits"],
});

export const tiktokDetector = createPlatformDetector({
  platform: "tiktok",
  fileNameHints: ["tiktok", "tt", "creator"],
  headerHints: ["video views", "total play time", "average watch time", "traffic source", "new followers"],
  contentHints: ["tiktok", "creator center", "video views", "total play time"],
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
  tiktokDetector,
  metaAdsDetector,
] as const;

export function detectionScoreToResult(score: PlatformDetectionScore): DetectionResult {
  return {
    platform: score.platform,
    format: score.format,
    confidence: Number(score.confidence.toFixed(2)),
    issues: [],
  };
}
