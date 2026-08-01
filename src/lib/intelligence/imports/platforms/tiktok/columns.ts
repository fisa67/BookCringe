import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";

/**
 * Schema de colunas canônicas do TikTok — esqueleto do padrão oficial
 * (`imports/columns.ts` + `docs/intelligence/IMPORTS.md`). Ainda não está
 * ligado ao detector nem ao parser; quando o adapter chegar, este arquivo
 * vira a fonte única de verdade (mesmo padrão do YouTube).
 *
 * Aliases iniciais baseados na fixture `test-data/tiktok/tiktok-creator-analytics.csv`.
 */
export type TikTokCanonicalColumn =
  | "videoTitle"
  | "videoViews"
  | "totalPlayTime"
  | "averageWatchTime"
  | "trafficSource"
  | "newFollowers";

const ALIASES: Record<TikTokCanonicalColumn, readonly string[]> = {
  videoTitle: ["Video title"],
  videoViews: ["Video views"],
  totalPlayTime: ["Total play time"],
  averageWatchTime: ["Average watch time"],
  trafficSource: ["Traffic source"],
  newFollowers: ["New followers"],
};

export const TIKTOK_COLUMN_SCHEMA: CanonicalColumnSchema<TikTokCanonicalColumn> = {
  aliases: ALIASES,
  required: ["videoTitle", "videoViews"],
  optional: ["totalPlayTime", "averageWatchTime", "trafficSource", "newFollowers"],
};
