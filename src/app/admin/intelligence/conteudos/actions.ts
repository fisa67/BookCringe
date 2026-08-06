"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerId } from "@/lib/auth/ownerId";
import { linkContentToBook, unlinkContentFromBook } from "@/lib/services/intelligenceDatasetService";

const CONTENTS_PATH = "/admin/intelligence/conteudos";

/**
 * Confirma o matching assistido: o admin escolheu (a sugestão ou outro
 * Livro, manualmente) qual Livro este Content representa. Só grava a
 * referência — nenhum dado do Livro é copiado para o Content.
 */
export async function linkContentToBookAction(formData: FormData): Promise<void> {
  const contentId = formData.get("contentId");
  const bookId = formData.get("bookId");

  if (typeof contentId !== "string" || !contentId) {
    redirect(`${CONTENTS_PATH}?error=${encodeURIComponent("Conteúdo inválido.")}`);
  }

  if (typeof bookId !== "string" || !bookId) {
    redirect(`${CONTENTS_PATH}?error=${encodeURIComponent("Selecione um livro para vincular.")}`);
  }

  const ownerId = await requireOwnerId();
  const updated = await linkContentToBook(ownerId, { contentId, bookId });

  if (!updated) {
    redirect(`${CONTENTS_PATH}?error=${encodeURIComponent("Não foi possível vincular o livro. Tente novamente.")}`);
  }

  revalidatePath(CONTENTS_PATH);
  redirect(CONTENTS_PATH);
}

export async function unlinkContentFromBookAction(formData: FormData): Promise<void> {
  const contentId = formData.get("contentId");

  if (typeof contentId !== "string" || !contentId) {
    redirect(`${CONTENTS_PATH}?error=${encodeURIComponent("Conteúdo inválido.")}`);
  }

  const ownerId = await requireOwnerId();
  const updated = await unlinkContentFromBook(ownerId, contentId);

  if (!updated) {
    redirect(`${CONTENTS_PATH}?error=${encodeURIComponent("Não foi possível desvincular o livro. Tente novamente.")}`);
  }

  revalidatePath(CONTENTS_PATH);
  redirect(CONTENTS_PATH);
}
