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
 */

const DATASETS_TABLE = "intelligence_datasets";
const IMPORTS_TABLE = "intelligence_imports";
const CONTENTS_TABLE = "intelligence_contents";
const METRICS_TABLE = "intelligence_metrics";

export async function listDatasets(): Promise<IntelligenceDatasetRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(DATASETS_TABLE)
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[intelligenceDatasetService] listDatasets error", error);
    return null;
  }

  return data;
}

export async function findDatasetByPlatform(platform: ImportPlatform): Promise<IntelligenceDatasetRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(DATASETS_TABLE)
    .select("*")
    .eq("platform", platform)
    .maybeSingle();

  if (error) {
    console.error("[intelligenceDatasetService] findDatasetByPlatform error", error);
    return null;
  }

  return data;
}

export async function createDataset(payload: IntelligenceDatasetCreate): Promise<IntelligenceDatasetRecord | null> {
  const { data, error } = await supabaseAdminClient.from(DATASETS_TABLE).insert(payload).select().single();

  if (error) {
    console.error("[intelligenceDatasetService] createDataset error", error);
    return null;
  }

  return data;
}

/**
 * Encontra o Dataset de uma Platform ou cria um novo — é assim que um
 * Dataset "nasce" (`docs/datasets.md` seção 2.1): implicitamente, no
 * primeiro Import bem-sucedido, nunca por uma ação explícita do usuário.
 * Se o Dataset já existe, seu `name`/`description` não são sobrescritos
 * aqui — uma futura tela de "renomear" (`docs/datasets.md` seção 5.2) deve
 * ser a única a alterá-los depois da criação.
 */
export async function findOrCreateDataset(
  payload: IntelligenceDatasetCreate
): Promise<IntelligenceDatasetRecord | null> {
  const existing = await findDatasetByPlatform(payload.platform);
  if (existing) return existing;

  return createDataset(payload);
}

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

export async function listImports(): Promise<IntelligenceImportRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(IMPORTS_TABLE)
    .select("*")
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
 * Content existente em vez de duplicá-lo.
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

/** Metrics nunca são atualizadas — cada Import insere linhas novas, preservando o histórico. */
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
 * Todas as Metrics de todas as Datasets/Imports. Usada hoje pelo Dashboard
 * (`intelligenceDashboardService.ts`), que faz a agregação (última por
 * Content, soma, etc.) em memória — este service só busca o dado bruto,
 * nunca agrega, mesmo divisão de responsabilidade das outras funções aqui.
 */
export async function listMetrics(): Promise<IntelligenceMetricRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(METRICS_TABLE)
    .select("*")
    .order("measured_at", { ascending: false });

  if (error) {
    console.error("[intelligenceDatasetService] listMetrics error", error);
    return null;
  }

  return data;
}

export async function listContents(): Promise<IntelligenceContentRecord[] | null> {
  const { data, error } = await supabaseAdminClient.from(CONTENTS_TABLE).select("*").order("title", { ascending: true });

  if (error) {
    console.error("[intelligenceDatasetService] listContents error", error);
    return null;
  }

  return data;
}

/**
 * Confirma o matching assistido (`docs/content-matching.md`): grava só a
 * referência ao Livro (`book_id`) — nenhum outro campo do Content muda, e
 * nada do Livro é copiado para cá.
 */
export async function linkContentToBook(params: {
  contentId: string;
  bookId: string;
}): Promise<IntelligenceContentRecord | null> {
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

export async function unlinkContentFromBook(contentId: string): Promise<IntelligenceContentRecord | null> {
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
