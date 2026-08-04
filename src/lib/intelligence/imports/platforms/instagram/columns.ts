import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";

/**
 * Schemas de colunas canônicas do Instagram — padrão oficial
 * (`imports/columns.ts` + `docs/intelligence/IMPORTS.md`). Este arquivo é a
 * fonte única de verdade compartilhada entre detector e parser, mesmo
 * padrão do YouTube — mesmo havendo, aqui, mais de um schema porque o
 * Instagram tem mais de um formato de relatório (ver seção de audiência
 * abaixo).
 *
 * `INSTAGRAM_COLUMN_SCHEMA` (Reels) continua um esqueleto — sem detector
 * canônico nem adapter ligados ainda; só os 4 schemas de audiência abaixo
 * têm Adapter completo nesta sprint.
 *
 * Aliases do Reels baseados na fixture `test-data/instagram/instagram-reels-insights.csv`.
 * Adicionar pt-BR/es/etc. é só acrescentar strings nos arrays abaixo.
 */
export type InstagramCanonicalColumn =
  | "reelTitle"
  | "reach"
  | "accountsReached"
  | "likes"
  | "saves"
  | "shares"
  | "profileVisits";

const ALIASES: Record<InstagramCanonicalColumn, readonly string[]> = {
  reelTitle: ["Reel"],
  reach: ["Reach"],
  accountsReached: ["Accounts reached"],
  likes: ["Likes"],
  saves: ["Saves"],
  shares: ["Shares"],
  profileVisits: ["Profile visits"],
};

export const INSTAGRAM_COLUMN_SCHEMA: CanonicalColumnSchema<InstagramCanonicalColumn> = {
  aliases: ALIASES,
  required: ["reelTitle", "reach"],
  optional: ["accountsReached", "likes", "saves", "shares", "profileVisits"],
};

/**
 * Schemas dos 4 exports de audiência do Instagram (FollowerHistory,
 * FollowerActivity, FollowerGender, FollowerTopTerritories) — famílias de
 * dados completamente diferentes do relatório de Reels acima (mesma
 * plataforma, formatos de arquivo distintos), por isso ficam em schemas
 * próprios em vez de tentar encaixar tudo num único
 * `InstagramCanonicalColumn`. Cada schema é consumido pelo detector
 * (`detection/platformDetectors.ts`) e pelo módulo de parse/normalize
 * correspondente (`audienceHistory.ts`, `audienceActivity.ts`,
 * `audienceDemographics.ts`, `audienceTerritories.ts`) — nunca duas listas
 * de aliases para a mesma coluna, mesmo padrão do YouTube.
 */

export type InstagramAudienceHistoryColumn = "date" | "followers" | "followersDelta";

const AUDIENCE_HISTORY_ALIASES: Record<InstagramAudienceHistoryColumn, readonly string[]> = {
  date: ["Date", "Data"],
  followers: ["Followers", "Seguidores"],
  followersDelta: [
    "Difference in followers from previous day",
    "Diferença de seguidores em relação ao dia anterior",
  ],
};

export const INSTAGRAM_AUDIENCE_HISTORY_SCHEMA: CanonicalColumnSchema<InstagramAudienceHistoryColumn> = {
  aliases: AUDIENCE_HISTORY_ALIASES,
  required: ["date", "followers"],
  optional: ["followersDelta"],
};

export type InstagramAudienceActivityColumn = "date" | "hour" | "activeFollowers";

const AUDIENCE_ACTIVITY_ALIASES: Record<InstagramAudienceActivityColumn, readonly string[]> = {
  date: ["Date", "Data"],
  hour: ["Hour", "Hora"],
  activeFollowers: ["Active followers", "Seguidores ativos"],
};

export const INSTAGRAM_AUDIENCE_ACTIVITY_SCHEMA: CanonicalColumnSchema<InstagramAudienceActivityColumn> = {
  aliases: AUDIENCE_ACTIVITY_ALIASES,
  required: ["date", "hour", "activeFollowers"],
};

export type InstagramAudienceDemographicsColumn = "gender" | "distribution";

const AUDIENCE_DEMOGRAPHICS_ALIASES: Record<InstagramAudienceDemographicsColumn, readonly string[]> = {
  gender: ["Gender", "Gênero"],
  distribution: ["Distribution", "Distribuição"],
};

export const INSTAGRAM_AUDIENCE_DEMOGRAPHICS_SCHEMA: CanonicalColumnSchema<InstagramAudienceDemographicsColumn> = {
  aliases: AUDIENCE_DEMOGRAPHICS_ALIASES,
  required: ["gender", "distribution"],
};

export type InstagramAudienceTerritoryColumn = "territory" | "distribution";

const AUDIENCE_TERRITORY_ALIASES: Record<InstagramAudienceTerritoryColumn, readonly string[]> = {
  territory: ["Top territories", "Principais territórios"],
  distribution: ["Distribution", "Distribuição"],
};

export const INSTAGRAM_AUDIENCE_TERRITORY_SCHEMA: CanonicalColumnSchema<InstagramAudienceTerritoryColumn> = {
  aliases: AUDIENCE_TERRITORY_ALIASES,
  required: ["territory", "distribution"],
};
