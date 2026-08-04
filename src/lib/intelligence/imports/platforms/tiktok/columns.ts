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

export type TikTokPromotionsCanonicalColumn =
  | "adCostBrl"
  | "videoViews"
  | "newFollowers"
  | "costPerView"
  | "costPerFollower"
  | "measuredAt"
  | "videoTitle";

const PROMOTIONS_ALIASES: Record<TikTokPromotionsCanonicalColumn, readonly string[]> = {
  adCostBrl: ["ad_cost_brl", "Ad cost (BRL)", "Ad cost BRL", "Gasto (BRL)", "Custo do anúncio (BRL)"],
  videoViews: ["video_views", "Video views", "Views", "Visualizações do vídeo"],
  newFollowers: ["new_followers", "New followers", "Followers gained", "Novos seguidores"],
  costPerView: ["cost_per_view", "Cost per view", "Custo por visualização"],
  costPerFollower: ["cost_per_follower", "Cost per follower", "Custo por seguidor"],
  measuredAt: ["date", "Date", "data", "Data", "measured_at"],
  videoTitle: ["video_title", "Video title", "Título do vídeo"],
};

/**
 * Campaign-shaped TikTok Promotions. Only raw facts are required/persisted;
 * cost ratios are accepted for detection but deliberately discarded.
 */
export const TIKTOK_PROMOTIONS_COLUMN_SCHEMA: CanonicalColumnSchema<TikTokPromotionsCanonicalColumn> = {
  aliases: PROMOTIONS_ALIASES,
  required: ["adCostBrl", "videoViews", "newFollowers", "measuredAt"],
  optional: ["costPerView", "costPerFollower", "videoTitle"],
};
