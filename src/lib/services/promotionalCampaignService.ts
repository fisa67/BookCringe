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
