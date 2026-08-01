import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";

/**
 * Schema de colunas canônicas do Instagram — esqueleto do padrão oficial
 * (`imports/columns.ts` + `docs/intelligence/IMPORTS.md`). Ainda não está
 * ligado ao detector nem ao parser (ambos ainda são stubs/keyword-based);
 * quando o adapter do Instagram chegar, este arquivo vira a fonte única
 * de verdade compartilhada entre os dois — o mesmo padrão do YouTube.
 *
 * Aliases iniciais baseados na fixture `test-data/instagram/instagram-reels-insights.csv`.
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
