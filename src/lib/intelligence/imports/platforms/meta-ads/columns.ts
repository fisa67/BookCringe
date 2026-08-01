import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";

/**
 * Schema de colunas canônicas do Meta Ads — esqueleto do padrão oficial
 * (`imports/columns.ts` + `docs/intelligence/IMPORTS.md`). Ainda não está
 * ligado ao detector nem ao parser; quando o adapter chegar, este arquivo
 * vira a fonte única de verdade (mesmo padrão do YouTube).
 *
 * Aliases iniciais baseados na fixture `test-data/meta-ads/meta-ads-campaigns.csv`.
 */
export type MetaAdsCanonicalColumn =
  | "campaignName"
  | "adSetName"
  | "amountSpent"
  | "impressions"
  | "cpm"
  | "ctr"
  | "results";

const ALIASES: Record<MetaAdsCanonicalColumn, readonly string[]> = {
  campaignName: ["Campaign name"],
  adSetName: ["Ad set name"],
  amountSpent: ["Amount spent"],
  impressions: ["Impressions"],
  cpm: ["CPM"],
  ctr: ["CTR"],
  results: ["Results"],
};

export const META_ADS_COLUMN_SCHEMA: CanonicalColumnSchema<MetaAdsCanonicalColumn> = {
  aliases: ALIASES,
  required: ["campaignName", "amountSpent"],
  optional: ["adSetName", "impressions", "cpm", "ctr", "results"],
};
