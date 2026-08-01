import type {
  CmsPromotionalCampaignItemRecord,
  CmsPromotionalCampaignRecord,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const CAMPAIGNS_TABLE = "promotional_campaigns" as const;
const ITEMS_TABLE = "promotional_campaign_items" as const;

export interface CmsPromotionalCampaignWithItems extends CmsPromotionalCampaignRecord {
  items: CmsPromotionalCampaignItemRecord[];
}

type CampaignPayload = Omit<CmsPromotionalCampaignRecord, "id" | "created_at" | "updated_at">;
type CampaignItemPayload = Omit<CmsPromotionalCampaignItemRecord, "id" | "created_at" | "updated_at">;

function now() {
  return new Date().toISOString();
}

export async function getPromotionalCampaigns(): Promise<CmsPromotionalCampaignRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[promotionalCampaignService] getPromotionalCampaigns error", error);
    return null;
  }

  return data;
}

export async function getPromotionalCampaignById(
  id: string
): Promise<CmsPromotionalCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[promotionalCampaignService] getPromotionalCampaignById error", error);
    return null;
  }

  return data;
}

export async function getPromotionalCampaignItems(
  campaignId: string
): Promise<CmsPromotionalCampaignItemRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .select("*")
    .eq("campaign_id", campaignId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[promotionalCampaignService] getPromotionalCampaignItems error", error);
    return null;
  }

  return data;
}

export type CampaignSummary = Pick<CmsPromotionalCampaignRecord, "id" | "name" | "slug">;

/**
 * Campanhas onde `bookId` aparece como item vinculado (`book_id`) — base da
 * seção "Participações" da Biblioteca (`bookParticipationsAdapter`) e da
 * futura lista "📍 Campanhas" em `/livro/[slug]`. Usa o embed do
 * PostgREST (`promotional_campaigns(...)`) via a FK `campaign_id` — mesma
 * técnica de `getFinishedReadingsWithBooks`/`getRecommendationHistory`
 * (o tipo `Database` não declara relações, mas a FK existe no Postgres).
 */
export async function getCampaignsContainingBook(bookId: string): Promise<CampaignSummary[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .select("promotional_campaigns(id, name, slug)")
    .eq("book_id", bookId);

  if (error) {
    console.error("[promotionalCampaignService] getCampaignsContainingBook error", error);
    return null;
  }

  const rows = data as unknown as Array<{ promotional_campaigns: CampaignSummary | null }>;
  const campaignsById = new Map<string, CampaignSummary>();
  for (const row of rows) {
    if (row.promotional_campaigns) {
      campaignsById.set(row.promotional_campaigns.id, row.promotional_campaigns);
    }
  }

  return Array.from(campaignsById.values());
}

/**
 * Mesmo relacionamento de `getCampaignsContainingBook`, mas filtrado para o
 * que a página pública `/livro/[slug]` pode mostrar: só campanhas
 * publicadas (`is_active`) e onde o item do livro também está ativo.
 * Usa `!inner` para poder filtrar por uma coluna da tabela relacionada
 * (`promotional_campaigns.is_active`) via PostgREST.
 */
export async function getActivePublicCampaignsForBook(bookId: string): Promise<CampaignSummary[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .select("promotional_campaigns!inner(id, name, slug, is_active)")
    .eq("book_id", bookId)
    .eq("is_active", true)
    .eq("promotional_campaigns.is_active", true);

  if (error) {
    console.error("[promotionalCampaignService] getActivePublicCampaignsForBook error", error);
    return null;
  }

  const rows = data as unknown as Array<{
    promotional_campaigns: (CampaignSummary & { is_active: boolean }) | null;
  }>;
  const campaignsById = new Map<string, CampaignSummary>();
  for (const row of rows) {
    if (row.promotional_campaigns) {
      const { id, name, slug } = row.promotional_campaigns;
      campaignsById.set(id, { id, name, slug });
    }
  }

  return Array.from(campaignsById.values());
}

export interface CampaignItemEvent {
  campaignId: string;
  campaignName: string;
  /** `promotional_campaign_items.created_at` — quando o livro entrou nesta campanha, usado na Timeline. */
  createdAt: string;
}

/**
 * Um evento por item de campanha vinculado a `bookId` (sem dedupe por
 * campanha, ao contrário de `getCampaignsContainingBook`) — base da
 * Timeline (`bookTimelineAdapter`), que precisa da data em que cada
 * vínculo foi criado. Mesmo embed do PostgREST das demais buscas
 * "campanhas de um livro" desta tabela.
 */
export async function getCampaignItemEventsForBook(bookId: string): Promise<CampaignItemEvent[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .select("created_at, promotional_campaigns(id, name)")
    .eq("book_id", bookId);

  if (error) {
    console.error("[promotionalCampaignService] getCampaignItemEventsForBook error", error);
    return null;
  }

  const rows = data as unknown as Array<{
    created_at: string;
    promotional_campaigns: { id: string; name: string } | null;
  }>;

  return rows.flatMap((row) => {
    if (!row.promotional_campaigns) return [];
    return [
      {
        campaignId: row.promotional_campaigns.id,
        campaignName: row.promotional_campaigns.name,
        createdAt: row.created_at,
      },
    ];
  });
}

export async function getActivePromotionalCampaign(): Promise<CmsPromotionalCampaignWithItems | null> {
  const { data, error } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[promotionalCampaignService] getActivePromotionalCampaign error", error);
    return null;
  }

  if (!data) return null;

  const items = await getPromotionalCampaignItems(data.id);
  return { ...data, items: items ?? [] };
}

export async function createPromotionalCampaign(
  payload: CampaignPayload
): Promise<CmsPromotionalCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[promotionalCampaignService] createPromotionalCampaign error", error);
    return null;
  }

  return data;
}

export async function updatePromotionalCampaign(
  payload: Partial<CampaignPayload> & { id: string }
): Promise<CmsPromotionalCampaignRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .update({ ...changes, updated_at: now() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[promotionalCampaignService] updatePromotionalCampaign error", error);
    return null;
  }

  return data;
}

export async function deletePromotionalCampaign(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(CAMPAIGNS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[promotionalCampaignService] deletePromotionalCampaign error", error);
    return false;
  }

  return true;
}

/**
 * Publica uma campanha e encerra a anterior. O índice parcial da migration
 * mantém a regra de uma única campanha ativa mesmo se duas requisições
 * acontecerem próximas uma da outra.
 */
export async function setPromotionalCampaignActive(id: string): Promise<boolean> {
  const { error: deactivateError } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .update({ is_active: false, updated_at: now() })
    .eq("is_active", true)
    .neq("id", id);

  if (deactivateError) {
    console.error("[promotionalCampaignService] setPromotionalCampaignActive deactivate error", deactivateError);
    return false;
  }

  const { error: activateError } = await supabaseAdminClient
    .from(CAMPAIGNS_TABLE)
    .update({ is_active: true, updated_at: now() })
    .eq("id", id);

  if (activateError) {
    console.error("[promotionalCampaignService] setPromotionalCampaignActive activate error", activateError);
    return false;
  }

  return true;
}

export async function createPromotionalCampaignItem(
  payload: CampaignItemPayload
): Promise<CmsPromotionalCampaignItemRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[promotionalCampaignService] createPromotionalCampaignItem error", error);
    return null;
  }

  return data;
}

export async function updatePromotionalCampaignItem(
  campaignId: string,
  payload: Partial<CampaignItemPayload> & { id: string }
): Promise<CmsPromotionalCampaignItemRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .update({ ...changes, updated_at: now() })
    .eq("id", id)
    .eq("campaign_id", campaignId)
    .select()
    .single();

  if (error) {
    console.error("[promotionalCampaignService] updatePromotionalCampaignItem error", error);
    return null;
  }

  return data;
}

export async function deletePromotionalCampaignItem(
  campaignId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabaseAdminClient
    .from(ITEMS_TABLE)
    .delete()
    .eq("id", id)
    .eq("campaign_id", campaignId);

  if (error) {
    console.error("[promotionalCampaignService] deletePromotionalCampaignItem error", error);
    return false;
  }

  return true;
}
