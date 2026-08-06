import { supabaseAdminClient } from "@/lib/supabase/client";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type {
  IntelligenceContentCreate,
  IntelligenceContentRecord,
  IntelligenceDatasetCreate,
  IntelligenceDatasetRecord,
  IntelligenceImportCreate,
  IntelligenceImportRecord,
  IntelligenceImportRowStatus,
  IntelligenceMetricCreate,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

/**
 * Persistência genérica do modelo canônico do Intelligence — Dataset,
 * Import, Content, Metric (`docs/data-model.md`, `docs/datasets.md`).
 * Agnóstica de plataforma: quem sabe que um registro veio de um CSV do
 * YouTube é o adapter (`imports/platforms/youtube/persistence.ts`), não
 * este arquivo. Qualquer plataforma futura (Instagram, TikTok...) reusa
 * exatamente estas mesmas funções.
 *
 * Multi-tenant (Sprint "Multi-Tenant Foundation",
 * `docs/intelligence/MULTI_TENANT_READINESS.md`): `owner_id` só existe em
 * `intelligence_datasets`. Todas as funções que leem/escrevem Import,
 * Content ou Metric recebem `ownerId` e resolvem o dono **através do
 * Dataset** — nunca duplicam a coluna nas 3 tabelas filhas. Duas formas de
 * usar `ownerId` aqui:
 *
 * 1. Filtro de leitura: `listImports`/`listContents`/`listMetrics` primeiro
 *    resolvem os `dataset_id` que pertencem a `ownerId` (via
 *    `listDatasets`) e então filtram por `dataset_id in (...)`.
 * 2. Validação de escrita: `findOrCreateDataset` é o único ponto que
 *    cria/associa um Dataset a um dono — `createImport`/`upsertContent`/
 *    `insertMetrics` recebem sempre um `dataset_id` que já saiu de um
 *    Dataset resolvido para `ownerId` (fluxo confiável, interno aos
 *    adapters de persistência). Já `linkContentToBook`/
 *    `unlinkContentFromBook` recebem um `contentId` vindo direto do
 *    cliente (formulário) — esse, sim, precisa validar a posse antes de
 *    escrever, porque não passou por nenhum Dataset já resolvido.
 */

const DATASETS_TABLE = "intelligence_datasets";
const IMPORTS_TABLE = "intelligence_imports";
const CONTENTS_TABLE = "intelligence_contents";
const METRICS_TABLE = "intelligence_metrics";

export async function listDatasets(ownerId: string): Promise<IntelligenceDatasetRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(DATASETS_TABLE)
    .select("*")
    .eq("owner_id", ownerId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[intelligenceDatasetService] listDatasets error", error);
    return null;
  }

  return data;
}

export async function findDatasetByPlatform(
  ownerId: string,
  platform: ImportPlatform
): Promise<IntelligenceDatasetRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(DATASETS_TABLE)
    .select("*")
    .eq("owner_id", ownerId)
    .eq("platform", platform)
    .maybeSingle();

  if (error) {
    console.error("[intelligenceDatasetService] findDatasetByPlatform error", error);
    return null;
  }

  return data;
}

export async function createDataset(
  ownerId: string,
  payload: Omit<IntelligenceDatasetCreate, "owner_id">
): Promise<IntelligenceDatasetRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(DATASETS_TABLE)
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();

  if (error) {
    console.error("[intelligenceDatasetService] createDataset error", error);
    return null;
  }

  return data;
}

/**
 * Encontra o Dataset de uma Platform **do dono informado** ou cria um novo
 * — é assim que um Dataset "nasce" (`docs/datasets.md` seção 2.1):
 * implicitamente, no primeiro Import bem-sucedido, nunca por uma ação
 * explícita do usuário. Se o Dataset já existe, seu `name`/`description`
 * não são sobrescritos aqui — uma futura tela de "renomear"
 * (`docs/datasets.md` seção 5.2) deve ser a única a alterá-los depois da
 * criação.
 *
 * É o único ponto de entrada que decide a quem um Dataset pertence — todo
 * adapter de persistência (YouTube/Instagram/TikTok) chama esta função com
 * o `ownerId` do criador autenticado antes de gravar qualquer Import/
 * Content/Metric, garantindo que o Dataset resultante já nasce isolado por
 * dono (`unique (owner_id, platform)`).
 */
export async function findOrCreateDataset(
  ownerId: string,
  payload: Omit<IntelligenceDatasetCreate, "owner_id">
): Promise<IntelligenceDatasetRecord | null> {
  const existing = await findDatasetByPlatform(ownerId, payload.platform);
  if (existing) return existing;

  return createDataset(ownerId, payload);
}

/**
 * `dataset_id` aqui sempre vem de um Dataset já resolvido para um dono
 * (via `findOrCreateDataset`, chamado antes disto por todo adapter de
 * persistência) — por isso não recebe/valida `ownerId` de novo.
 */
export async function createImport(payload: IntelligenceImportCreate): Promise<IntelligenceImportRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(IMPORTS_TABLE)
    .insert({ status: "processing", ...payload })
    .select()
    .single();

  if (error) {
    console.error("[intelligenceDatasetService] createImport error", error);
    return null;
  }

  return data;
}

/** Resolve os ids dos Datasets de um dono — base do filtro de `listImports`/`listContents`/`listMetrics`. */
async function listOwnedDatasetIds(ownerId: string): Promise<string[] | null> {
  const datasets = await listDatasets(ownerId);
  if (datasets === null) return null;

  return datasets.map((dataset) => dataset.id);
}

export async function listImports(ownerId: string): Promise<IntelligenceImportRecord[] | null> {
  const datasetIds = await listOwnedDatasetIds(ownerId);
  if (datasetIds === null) return null;
  if (datasetIds.length === 0) return [];

  const { data, error } = await supabaseAdminClient
    .from(IMPORTS_TABLE)
    .select("*")
    .in("dataset_id", datasetIds)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("[intelligenceDatasetService] listImports error", error);
    return null;
  }

  return data;
}

/** Fecha um Import com o resultado final — chamado uma única vez, ao fim do processamento de todos os registros. */
export async function finalizeImport(params: {
  id: string;
  status: IntelligenceImportRowStatus;
  acceptedRecords: number;
  rejectedRecords: number;
}): Promise<boolean> {
  const { error } = await supabaseAdminClient
    .from(IMPORTS_TABLE)
    .update({
      status: params.status,
      accepted_records: params.acceptedRecords,
      rejected_records: params.rejectedRecords,
      finished_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    console.error("[intelligenceDatasetService] finalizeImport error", error);
    return false;
  }

  return true;
}

/**
 * Um Content é identificado, hoje, por `(dataset_id, title)` — o CSV do
 * YouTube Studio não traz um ID/URL estável de vídeo (ver comentário na
 * migration). O `upsert` garante que reimportar o mesmo vídeo atualiza o
 * Content existente em vez de duplicá-lo. `dataset_id` já vem de um
 * Dataset resolvido para um dono, mesma justificativa de `createImport`.
 */
export async function upsertContent(payload: IntelligenceContentCreate): Promise<IntelligenceContentRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(CONTENTS_TABLE)
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: "dataset_id,title" })
    .select()
    .single();

  if (error) {
    console.error("[intelligenceDatasetService] upsertContent error", error);
    return null;
  }

  return data;
}

/**
 * Metrics nunca são atualizadas — cada Import insere linhas novas,
 * preservando o histórico. `dataset_id`/`import_id` já vêm de um Dataset/
 * Import resolvidos para um dono, mesma justificativa de `createImport`.
 */
export async function insertMetrics(rows: IntelligenceMetricCreate[]): Promise<boolean> {
  if (rows.length === 0) return true;

  const { error } = await supabaseAdminClient.from(METRICS_TABLE).insert(rows);

  if (error) {
    console.error("[intelligenceDatasetService] insertMetrics error", error);
    return false;
  }

  return true;
}

/**
 * Todas as Metrics dos Datasets de um dono. Usada hoje pelo Dashboard
 * (`intelligenceDashboardService.ts`), que faz a agregação (última por
 * Content, soma, etc.) em memória — este service só busca o dado bruto,
 * nunca agrega, mesma divisão de responsabilidade das outras funções aqui.
 */
export async function listMetrics(ownerId: string): Promise<IntelligenceMetricRecord[] | null> {
  const datasetIds = await listOwnedDatasetIds(ownerId);
  if (datasetIds === null) return null;
  if (datasetIds.length === 0) return [];

  const { data, error } = await supabaseAdminClient
    .from(METRICS_TABLE)
    .select("*")
    .in("dataset_id", datasetIds)
    .order("measured_at", { ascending: false });

  if (error) {
    console.error("[intelligenceDatasetService] listMetrics error", error);
    return null;
  }

  return data;
}

export async function listContents(ownerId: string): Promise<IntelligenceContentRecord[] | null> {
  const datasetIds = await listOwnedDatasetIds(ownerId);
  if (datasetIds === null) return null;
  if (datasetIds.length === 0) return [];

  const { data, error } = await supabaseAdminClient
    .from(CONTENTS_TABLE)
    .select("*")
    .in("dataset_id", datasetIds)
    .order("title", { ascending: true });

  if (error) {
    console.error("[intelligenceDatasetService] listContents error", error);
    return null;
  }

  return data;
}

/** Dataset de um dono específico — base da validação de posse de `assertContentOwnership`. */
async function findOwnedDataset(ownerId: string, datasetId: string): Promise<IntelligenceDatasetRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(DATASETS_TABLE)
    .select("*")
    .eq("id", datasetId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[intelligenceDatasetService] findOwnedDataset error", error);
    return null;
  }

  return data;
}

/**
 * Valida que um Content pertence a `ownerId`, seguindo `content → dataset
 * → owner_id`. Diferente de `createImport`/`upsertContent`/`insertMetrics`
 * (que só recebem ids já resolvidos internamente), `linkContentToBook`/
 * `unlinkContentFromBook` recebem `contentId` direto de um `<form>` — sem
 * esta validação, um segundo criador poderia vincular/desvincular Content
 * de outro dono só adivinhando/inspecionando o id.
 */
async function assertContentOwnership(ownerId: string, contentId: string): Promise<boolean> {
  const { data, error } = await supabaseAdminClient
    .from(CONTENTS_TABLE)
    .select("dataset_id")
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) return false;

  const dataset = await findOwnedDataset(ownerId, data.dataset_id);
  return dataset !== null;
}

/**
 * Confirma o matching assistido (`docs/content-matching.md`): grava só a
 * referência ao Livro (`book_id`) — nenhum outro campo do Content muda, e
 * nada do Livro é copiado para cá.
 */
export async function linkContentToBook(
  ownerId: string,
  params: { contentId: string; bookId: string }
): Promise<IntelligenceContentRecord | null> {
  const owned = await assertContentOwnership(ownerId, params.contentId);
  if (!owned) return null;

  const { data, error } = await supabaseAdminClient
    .from(CONTENTS_TABLE)
    .update({ book_id: params.bookId, updated_at: new Date().toISOString() })
    .eq("id", params.contentId)
    .select()
    .single();

  if (error) {
    console.error("[intelligenceDatasetService] linkContentToBook error", error);
    return null;
  }

  return data;
}

export async function unlinkContentFromBook(
  ownerId: string,
  contentId: string
): Promise<IntelligenceContentRecord | null> {
  const owned = await assertContentOwnership(ownerId, contentId);
  if (!owned) return null;

  const { data, error } = await supabaseAdminClient
    .from(CONTENTS_TABLE)
    .update({ book_id: null, updated_at: new Date().toISOString() })
    .eq("id", contentId)
    .select()
    .single();

  if (error) {
    console.error("[intelligenceDatasetService] unlinkContentFromBook error", error);
    return null;
  }

  return data;
}
