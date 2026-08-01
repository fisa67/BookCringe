import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";

/**
 * Schema de colunas canônicas do Google Analytics — esqueleto do padrão
 * oficial (`imports/columns.ts` + `docs/intelligence/IMPORTS.md`). Ainda
 * não está ligado a detector nem parser (nenhum dos dois existe ainda para
 * GA); quando o adapter chegar, este arquivo vira a fonte única de verdade
 * (mesmo padrão do YouTube).
 *
 * Aliases iniciais são um ponto de partida genérico para exportações GA4
 * comuns — devem ser revisados contra um export real na sprint do adapter.
 */
export type GoogleAnalyticsCanonicalColumn =
  | "pageTitle"
  | "pagePath"
  | "sessions"
  | "users"
  | "pageviews"
  | "bounceRate";

const ALIASES: Record<GoogleAnalyticsCanonicalColumn, readonly string[]> = {
  pageTitle: ["Page title", "Título da página"],
  pagePath: ["Page path", "Caminho da página"],
  sessions: ["Sessions", "Sessões"],
  users: ["Users", "Usuários", "Active users"],
  pageviews: ["Views", "Pageviews", "Visualizações"],
  bounceRate: ["Bounce rate", "Taxa de rejeição"],
};

export const GOOGLE_ANALYTICS_COLUMN_SCHEMA: CanonicalColumnSchema<GoogleAnalyticsCanonicalColumn> = {
  aliases: ALIASES,
  required: ["pagePath", "sessions"],
  optional: ["pageTitle", "users", "pageviews", "bounceRate"],
};
