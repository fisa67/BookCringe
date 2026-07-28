import type { CmsNewsletterCampaignRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "newsletter_campaigns";

export async function getCampaignsCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[campaignService] getCampaignsCount error", error);
    return null;
  }

  return count;
}

/** Lista campanhas, mais recentes primeiro — usado por `/admin/newsletters`. */
export async function getCampaigns(): Promise<CmsNewsletterCampaignRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[campaignService] getCampaigns error", error);
    return null;
  }

  return data;
}

export async function getCampaignById(id: string): Promise<CmsNewsletterCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[campaignService] getCampaignById error", error);
    return null;
  }

  return data;
}

/**
 * Campanha `sent` mais recente (por `sent_at`) — usada no painel de
 * `/admin/newsletters` ("Última campanha enviada"). `null` tanto em erro
 * quanto quando nenhuma campanha foi enviada ainda (`maybeSingle`, não
 * `single` — ausência de linha não é erro aqui).
 */
export async function getLatestSentCampaign(): Promise<CmsNewsletterCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[campaignService] getLatestSentCampaign error", error);
    return null;
  }

  return data;
}

export interface CreateCampaignInput {
  title: string;
  subject: string;
  content: string;
}

/** Cria uma campanha sempre como `draft`, sem destinatários — nunca envia nada aqui. */
export async function createCampaign(payload: CreateCampaignInput): Promise<CmsNewsletterCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert({
      title: payload.title,
      subject: payload.subject,
      content: payload.content,
      status: "draft",
      recipients_count: 0,
      sent_at: null,
    })
    .select()
    .single();

  if (error) {
    console.error("[campaignService] createCampaign error", error);
    return null;
  }

  return data;
}

export interface UpdateCampaignInput {
  id: string;
  title: string;
  subject: string;
  content: string;
}

/**
 * Atualiza título/assunto/conteúdo de uma campanha. Quem decide SE a
 * campanha pode ser editada (só `draft`) é a Server Action
 * (`updateCampaignAction`) — este service só persiste, sem regra de
 * negócio, mesmo padrão de `contentService.updateContent`.
 */
export async function updateCampaign(payload: UpdateCampaignInput): Promise<CmsNewsletterCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update({
      title: payload.title,
      subject: payload.subject,
      content: payload.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[campaignService] updateCampaign error", error);
    return null;
  }

  return data;
}

/** Duplica uma campanha existente como novo `draft` — título com sufixo "(cópia)", sem destinatários/data de envio. */
export async function duplicateCampaign(id: string): Promise<CmsNewsletterCampaignRecord | null> {
  const original = await getCampaignById(id);

  if (!original) {
    return null;
  }

  return createCampaign({
    title: `${original.title} (cópia)`,
    subject: original.subject,
    content: original.content,
  });
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("[campaignService] deleteCampaign error", error);
    return false;
  }

  return true;
}

/** Marca a campanha como enviada — só chamado por `campaignEmailService.sendCampaignToCrew` após o envio ter sucesso. */
export async function markCampaignAsSent(
  id: string,
  recipientsCount: number
): Promise<CmsNewsletterCampaignRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update({
      status: "sent",
      recipients_count: recipientsCount,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[campaignService] markCampaignAsSent error", error);
    return null;
  }

  return data;
}
