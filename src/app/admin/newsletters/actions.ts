"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import {
  createCampaign,
  deleteCampaign,
  duplicateCampaign,
  getCampaignById,
  markCampaignAsSent,
  updateCampaign,
} from "@/lib/services/campaignService";
import { sendCampaignTest, sendCampaignToCrew } from "@/lib/services/campaignEmailService";
import { uploadNewsletterImage } from "@/lib/services/newsletterImageService";
import {
  newsletterCampaignFormDataToInput,
  newsletterCampaignFormSchema,
} from "@/lib/validations/newsletterCampaign";
import { formatValidationErrors } from "@/lib/validations/forms";
import { sanitizeNewsletterContent } from "@/lib/newsletters/content";

/**
 * Server Actions do módulo Newsletters — única porta de escrita usada pela
 * UI (`NewsletterCampaignForm`, listagem, página de visualização). Toda a
 * persistência passa por `campaignService`/`campaignEmailService`; nenhum
 * componente acessa o Supabase ou o Resend diretamente. Mesmo padrão de
 * erro dos demais módulos: redireciona de volta com `?error=`.
 */

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

function sanitizedCampaignFormDataToInput(formData: FormData): Record<string, unknown> {
  const input = newsletterCampaignFormDataToInput(formData);
  return {
    ...input,
    content: typeof input.content === "string" ? sanitizeNewsletterContent(input.content) : input.content,
  };
}

export async function uploadNewsletterImageAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false as const, error: "Selecione uma imagem para enviar." };
  }

  return uploadNewsletterImage(file);
}

export async function createCampaignAction(formData: FormData): Promise<void> {
  const parsed = newsletterCampaignFormSchema.safeParse(sanitizedCampaignFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/newsletters/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const created = await createCampaign(parsed.data);

  if (!created) {
    redirect(
      `/admin/newsletters/new?error=${encodeURIComponent("Não foi possível salvar a newsletter. Tente novamente.")}`
    );
  }

  revalidatePath("/admin/newsletters");
  revalidatePath("/admin");
  redirect(`/admin/newsletters/${created.id}`);
}

export async function updateCampaignAction(id: string, formData: FormData): Promise<void> {
  const existing = await getCampaignById(id);

  if (!existing) {
    redirect(`/admin/newsletters?error=${encodeURIComponent("Newsletter não encontrada.")}`);
  }

  // Campanhas já enviadas ficam imutáveis — evita reescrever o histórico de
  // um e-mail que já saiu para o Crew.
  if (existing.status !== "draft") {
    redirect(
      `/admin/newsletters/${id}?error=${encodeURIComponent("Só é possível editar newsletters em rascunho.")}`
    );
  }

  const parsed = newsletterCampaignFormSchema.safeParse(sanitizedCampaignFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/newsletters/${id}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const updated = await updateCampaign({ id, ...parsed.data });

  if (!updated) {
    redirect(
      `/admin/newsletters/${id}/edit?error=${encodeURIComponent("Não foi possível salvar a newsletter. Tente novamente.")}`
    );
  }

  revalidatePath("/admin/newsletters");
  revalidatePath(`/admin/newsletters/${id}`);
  redirect(`/admin/newsletters/${id}`);
}

export async function duplicateCampaignAction(id: string): Promise<void> {
  const duplicated = await duplicateCampaign(id);

  if (!duplicated) {
    redirect(`/admin/newsletters?error=${encodeURIComponent("Não foi possível duplicar a newsletter.")}`);
  }

  revalidatePath("/admin/newsletters");
  redirect(`/admin/newsletters/${duplicated.id}/edit`);
}

export async function deleteCampaignAction(id: string): Promise<void> {
  await deleteCampaign(id);
  revalidatePath("/admin/newsletters");
  revalidatePath("/admin");
  redirect("/admin/newsletters");
}

export async function sendTestCampaignAction(id: string): Promise<void> {
  const campaign = await getCampaignById(id);

  if (!campaign) {
    redirect(`/admin/newsletters?error=${encodeURIComponent("Newsletter não encontrada.")}`);
  }

  const result = await sendCampaignTest(campaign);

  if (!result.ok) {
    redirect(`/admin/newsletters/${id}?error=${encodeURIComponent(result.error ?? "Falha ao enviar o teste.")}`);
  }

  revalidatePath(`/admin/newsletters/${id}`);
  redirect(`/admin/newsletters/${id}?testSent=1`);
}

export async function sendToCrewCampaignAction(id: string): Promise<void> {
  const campaign = await getCampaignById(id);

  if (!campaign) {
    redirect(`/admin/newsletters?error=${encodeURIComponent("Newsletter não encontrada.")}`);
  }

  // Evita reenviar a mesma campanha duas vezes para todo mundo por engano.
  if (campaign.status === "sent") {
    redirect(`/admin/newsletters/${id}?error=${encodeURIComponent("Essa newsletter já foi enviada.")}`);
  }

  const result = await sendCampaignToCrew(campaign);

  if (!result.ok) {
    redirect(
      `/admin/newsletters/${id}?error=${encodeURIComponent(result.error ?? "Falha ao enviar para o Crew.")}`
    );
  }

  await markCampaignAsSent(id, result.recipientsCount);

  revalidatePath("/admin/newsletters");
  revalidatePath(`/admin/newsletters/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/newsletters/${id}?sent=1`);
}
