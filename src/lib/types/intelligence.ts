import type { ImportPlatform } from "@/lib/intelligence/imports/types";

/**
 * Tipos de PERSISTÊNCIA do Intelligence — o formato exato das linhas das
 * tabelas `intelligence_*` no Supabase (snake_case, iguais às colunas em
 * `supabase/migrations/20260801_intelligence_datasets.sql`).
 *
 * Não confundir com `src/lib/intelligence/model.ts` (modelo canônico,
 * camelCase, conceitual — ver `docs/data-model.md`) nem com
 * `imports/types.ts` (tipos efêmeros do pipeline). Este arquivo é, para o
 * Intelligence, o equivalente do que `cms.ts` é para o resto do CMS:
 * alimenta `database.ts` para tipar o client do Supabase.
 *
 * Cobre só as 4 tabelas implementadas até agora (Dataset, Import, Content,
 * Metric — só o suficiente para persistir o importador do YouTube).
 * `Platform` e `Insight` continuam sem tabela — ver `docs/datasets.md`
 * seção 7 para o que falta e por quê.
 *
 * `owner_id` (Sprint "Multi-Tenant Foundation",
 * `supabase/migrations/20260805_intelligence_owner.sql`): a fronteira de
 * tenant do módulo. Só existe em `IntelligenceDatasetRecord`/`Create` — as
 * outras 3 tabelas continuam sem coluna própria, pois todas alcançam o dono
 * por `dataset_id` (ver `intelligenceDatasetService.ts`). Marcado opcional
 * aqui (embora `not null` no banco) de propósito: quem garante que todo
 * Dataset sempre tem um dono é `intelligenceDatasetService.ts` (todo
 * `createDataset`/`findOrCreateDataset` exige `ownerId` como parâmetro) —
 * torná-lo obrigatório neste tipo obrigaria as dezenas de fixtures de
 * testes puros de agregação (que nunca leem `owner_id`) a inventar um
 * valor irrelevante para elas.
 */

export interface IntelligenceDatasetRecord {
  id: string;
  owner_id?: string;
  platform: ImportPlatform;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceDatasetCreate {
  owner_id?: string;
  platform: ImportPlatform;
  name: string;
  description?: string;
}

export type IntelligenceImportRowStatus = "pending" | "processing" | "completed" | "failed";

export interface IntelligenceImportRecord {
  id: string;
  dataset_id: string;
  status: IntelligenceImportRowStatus;
  file_name: string;
  accepted_records: number;
  rejected_records: number;
  started_at: string;
  finished_at?: string;
}

export interface IntelligenceImportCreate {
  dataset_id: string;
  file_name: string;
  status?: IntelligenceImportRowStatus;
}

export interface IntelligenceContentRecord {
  id: string;
  dataset_id: string;
  title: string;
  external_url?: string;
  published_at?: string;
  /**
   * Referência (apenas o id) para um Livro do CMS (`public.books`) —
   * matching assistido, nunca automático. Ver `docs/content-matching.md`.
   * Nunca copiamos autor/editora/gênero/etc. do Livro para cá: qualquer
   * análise cruzada lê esses campos direto do Livro, via join por este id.
   */
  book_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceContentCreate {
  dataset_id: string;
  title: string;
  external_url?: string;
  published_at?: string;
  updated_at?: string;
}

export interface IntelligenceMetricRecord {
  id: string;
  dataset_id: string;
  import_id: string;
  content_id?: string;
  key: string;
  value: number;
  unit?: string;
  measured_at: string;
  created_at: string;
}

export interface IntelligenceMetricCreate {
  dataset_id: string;
  import_id: string;
  content_id?: string;
  key: string;
  value: number;
  unit?: string;
  measured_at: string;
}
