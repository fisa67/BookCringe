"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import {
  createPromotionalCampaign,
  createPromotionalCampaignItem,
  deletePromotionalCampaign,
  deletePromotionalCampaignItem,
  getPromotionalCampaignById,
  getPromotionalCampaignItems,
  setPromotionalCampaignActive,
  updatePromotionalCampaign,
  updatePromotionalCampaignItem,
} from "@/lib/services/promotionalCampaignService";
import { getBookById } from "@/lib/services/bookService";
import {
  promotionalCampaignFormDataToInput,
  promotionalCampaignFormSchema,
  promotionalCampaignItemFormDataToInput,
  promotionalCampaignItemFormSchema,
} from "@/lib/validations/promotionalCampaign";
import { formatValidationErrors } from "@/lib/validations/forms";

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

function revalidateCampaignPaths(campaignId?: string) {
  revalidatePath("/admin/campaigns");
  revalidatePath("/ofertas");
  if (campaignId) revalidatePath(`/admin/campaigns/${campaignId}`);
}

/**
 * Quando um item vinculado a um livro entra/sai/muda numa campanha, tanto a
 * seção "Participações" (`/admin/books/[id]/edit`) quanto os badges "📍
 * Campanha" da página pública do livro (`/livro/[slug]`) ficam
 * desatualizados até a próxima revalidação — antecipamos isso aqui, mesmo
 * padrão de `markAsRecommendationOfMonthAction`.
 */
async function revalidateBookPaths(bookId: string | null) {
  if (!bookId) return;

  revalidatePath(`/admin/books/${bookId}/edit`);

  const book = await getBookById(bookId);
  if (book?.slug) {
    revalidatePath(`/livro/${book.slug}`);
  }
}

export async function createPromotionalCampaignAction(formData: FormData): Promise<void> {
  const parsed = promotionalCampaignFormSchema.safeParse(promotionalCampaignFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/campaigns/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const created = await createPromotionalCampaign({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    banner_url: parsed.data.banner_url ?? null,
    is_active: false,
  });

  if (!created) {
    redirect(
      `/admin/campaigns/new?error=${encodeURIComponent("Não foi possível criar a campanha. O slug pode já estar em uso.")}`
    );
  }

  if (parsed.data.is_active && !(await setPromotionalCampaignActive(created.id))) {
    redirect(
      `/admin/campaigns/${created.id}/edit?error=${encodeURIComponent("A campanha foi criada, mas não pôde ser publicada.")}`
    );
  }

  revalidateCampaignPaths(created.id);
  redirect(`/admin/campaigns/${created.id}`);
}

export async function updatePromotionalCampaignAction(
  campaignId: string,
  formData: FormData
): Promise<void> {
  const parsed = promotionalCampaignFormSchema.safeParse(promotionalCampaignFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/campaigns/${campaignId}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const existing = await getPromotionalCampaignById(campaignId);
  if (!existing) {
    redirect(`/admin/campaigns?error=${encodeURIComponent("Campanha não encontrada.")}`);
  }

  const updated = await updatePromotionalCampaign({
    id: campaignId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    banner_url: parsed.data.banner_url ?? null,
    is_active: false,
  });

  if (!updated) {
    redirect(
      `/admin/campaigns/${campaignId}/edit?error=${encodeURIComponent("Não foi possível salvar a campanha. O slug pode já estar em uso.")}`
    );
  }

  if (parsed.data.is_active && !(await setPromotionalCampaignActive(campaignId))) {
    redirect(
      `/admin/campaigns/${campaignId}/edit?error=${encodeURIComponent("A campanha foi salva, mas não pôde ser publicada.")}`
    );
  }

  revalidateCampaignPaths(campaignId);
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function activatePromotionalCampaignAction(campaignId: string): Promise<void> {
  const activated = await setPromotionalCampaignActive(campaignId);

  if (!activated) {
    redirect(
      `/admin/campaigns/${campaignId}?error=${encodeURIComponent("Não foi possível publicar a campanha.")}`
    );
  }

  revalidateCampaignPaths(campaignId);
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function deletePromotionalCampaignAction(campaignId: string): Promise<void> {
  await deletePromotionalCampaign(campaignId);
  revalidateCampaignPaths();
  redirect("/admin/campaigns");
}

export async function createPromotionalCampaignItemAction(
  campaignId: string,
  formData: FormData
): Promise<void> {
  const parsed = promotionalCampaignItemFormSchema.safeParse(
    promotionalCampaignItemFormDataToInput(formData)
  );

  if (!parsed.success) {
    redirect(
      `/admin/campaigns/${campaignId}/items/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const campaign = await getPromotionalCampaignById(campaignId);
  if (!campaign) {
    redirect(`/admin/campaigns?error=${encodeURIComponent("Campanha não encontrada.")}`);
  }

  let position = parsed.data.position;
  if (position === undefined) {
    const existingItems = await getPromotionalCampaignItems(campaignId);
    position =
      existingItems && existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.position)) + 1
        : 0;
  }

  const created = await createPromotionalCampaignItem({
    campaign_id: campaignId,
    book_id: parsed.data.book_id,
    title: parsed.data.title,
    image_url: parsed.data.image_url,
    description: parsed.data.description,
    affiliate_url: parsed.data.affiliate_url,
    price: parsed.data.price ?? null,
    position,
    is_active: parsed.data.is_active,
    item_type: parsed.data.item_type,
  });

  if (!created) {
    redirect(
      `/admin/campaigns/${campaignId}/items/new?error=${encodeURIComponent("Não foi possível adicionar o item.")}`
    );
  }

  revalidateCampaignPaths(campaignId);
  await revalidateBookPaths(parsed.data.book_id);
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function updatePromotionalCampaignItemAction(
  campaignId: string,
  itemId: string,
  formData: FormData
): Promise<void> {
  const parsed = promotionalCampaignItemFormSchema.safeParse(
    promotionalCampaignItemFormDataToInput(formData)
  );

  if (!parsed.success) {
    redirect(
      `/admin/campaigns/${campaignId}/items/${itemId}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const existingItems = await getPromotionalCampaignItems(campaignId);
  const previousBookId = existingItems?.find((candidate) => candidate.id === itemId)?.book_id ?? null;

  const updated = await updatePromotionalCampaignItem(campaignId, {
    id: itemId,
    book_id: parsed.data.book_id,
    title: parsed.data.title,
    image_url: parsed.data.image_url,
    description: parsed.data.description,
    affiliate_url: parsed.data.affiliate_url,
    price: parsed.data.price ?? null,
    ...(parsed.data.position === undefined ? {} : { position: parsed.data.position }),
    is_active: parsed.data.is_active,
    item_type: parsed.data.item_type,
  });

  if (!updated) {
    redirect(
      `/admin/campaigns/${campaignId}/items/${itemId}/edit?error=${encodeURIComponent("Não foi possível salvar o item.")}`
    );
  }

  revalidateCampaignPaths(campaignId);
  await revalidateBookPaths(previousBookId);
  if (parsed.data.book_id !== previousBookId) {
    await revalidateBookPaths(parsed.data.book_id);
  }
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function deletePromotionalCampaignItemAction(
  campaignId: string,
  itemId: string
): Promise<void> {
  const existingItems = await getPromotionalCampaignItems(campaignId);
  const bookId = existingItems?.find((candidate) => candidate.id === itemId)?.book_id ?? null;

  await deletePromotionalCampaignItem(campaignId, itemId);
  revalidateCampaignPaths(campaignId);
  await revalidateBookPaths(bookId);
  redirect(`/admin/campaigns/${campaignId}`);
}
