"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { createContent, deleteContent, updateContent } from "@/lib/services/contentService";
import { contentFormDataToInput, contentFormSchema } from "@/lib/validations/content";
import { formatValidationErrors } from "@/lib/validations/forms";

/**
 * Server Actions do módulo Conteúdo — única porta de escrita usada pela UI
 * (`ContentForm`, botão de exclusão). Toda a persistência passa por
 * `src/lib/services/contentService.ts`; nenhum componente acessa o Supabase
 * diretamente. Mesmo padrão de erro dos demais módulos: redireciona de
 * volta ao formulário com `?error=` (sem preservar os campos já digitados).
 */

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

export async function createContentAction(formData: FormData): Promise<void> {
  const parsed = contentFormSchema.safeParse(contentFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/content/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const created = await createContent({
    book_id: parsed.data.book_id,
    content_category: parsed.data.content_category,
    title: parsed.data.title,
    platform: parsed.data.platform,
    content_type: parsed.data.content_type,
    url: parsed.data.url,
    is_featured: parsed.data.is_featured,
    published_at: parsed.data.published_at,
    thumbnail_path: parsed.data.thumbnail_path,
    metadata: {},
  });

  if (!created) {
    redirect(
      `/admin/content/new?error=${encodeURIComponent("Não foi possível salvar o conteúdo. Verifique os dados e tente novamente.")}`
    );
  }

  revalidatePath("/admin/content");
  revalidatePath("/admin");
  redirect("/admin/content");
}

export async function updateContentAction(id: string, formData: FormData): Promise<void> {
  const parsed = contentFormSchema.safeParse(contentFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/content/${id}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const updated = await updateContent({
    id,
    book_id: parsed.data.book_id,
    content_category: parsed.data.content_category,
    title: parsed.data.title,
    platform: parsed.data.platform,
    content_type: parsed.data.content_type,
    url: parsed.data.url,
    is_featured: parsed.data.is_featured,
    published_at: parsed.data.published_at ?? undefined,
    thumbnail_path: parsed.data.thumbnail_path,
  });

  if (!updated) {
    redirect(
      `/admin/content/${id}/edit?error=${encodeURIComponent("Não foi possível salvar o conteúdo. Verifique os dados e tente novamente.")}`
    );
  }

  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function deleteContentAction(id: string): Promise<void> {
  await deleteContent(id);
  revalidatePath("/admin/content");
  revalidatePath("/admin");
  redirect("/admin/content");
}
