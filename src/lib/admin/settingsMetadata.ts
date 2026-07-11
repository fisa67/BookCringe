/**
 * Campos extras das Configurações que não têm coluna própria no schema
 * (`settings`) — guardados em `metadata` (jsonb), mesmo padrão já usado no
 * módulo Clube de Leitura (`start_date`/`end_date`/`is_active` em
 * `bookclub_months.metadata`). Evita migração de banco neste ciclo.
 */
export interface SettingsMetadataFields {
  description?: string;
  linkedin_url?: string;
  personal_site_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  active_bookclub_year_id?: string;
  active_bookclub_month_id?: string;
}

const METADATA_TEXT_KEYS = [
  "description",
  "linkedin_url",
  "personal_site_url",
  "hero_title",
  "hero_subtitle",
  "active_bookclub_year_id",
  "active_bookclub_month_id",
] as const;

export function getSettingsMetadataField(
  metadata: Record<string, unknown> | undefined,
  key: keyof SettingsMetadataFields
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Constrói o novo `metadata` a partir do metadata atual (preserva chaves
 * desconhecidas) e dos campos extras do formulário — valor ausente/vazio
 * remove a chave (mesma convenção de `updateBookClubMonthAction`).
 */
export function buildSettingsMetadata(
  currentMetadata: Record<string, unknown> | undefined,
  fields: SettingsMetadataFields
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { ...currentMetadata };

  for (const key of METADATA_TEXT_KEYS) {
    const value = fields[key];
    if (value) {
      metadata[key] = value;
    } else {
      delete metadata[key];
    }
  }

  return metadata;
}
