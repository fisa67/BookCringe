"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { createBook, deleteBook, updateBook } from "@/lib/services/bookService";
import { bookFormDataToInput, bookFormSchema } from "@/lib/validations/book";
import { formatValidationErrors } from "@/lib/validations/forms";
import { slugify } from "@/lib/utils";

/**
 * Server Actions do módulo Biblioteca — única porta de escrita usada pela UI
 * (`BookForm`, `DeleteBookButton`). Toda a persistência passa por
 * `src/lib/services/bookService.ts`; nenhum componente acessa o Supabase
 * diretamente.
 *
 * Sem `useActionState`/erros inline: a UI do admin (assim como o login,
 * Fase 1B) prioriza o mínimo de JavaScript no cliente. Em caso de erro de
 * validação, o usuário é redirecionado de volta ao formulário com uma
 * mensagem em `?error=` (ver limitação no relatório: os campos já
 * preenchidos não são preservados nesse caminho de erro).
 */

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

export async function createBookAction(formData: FormData): Promise<void> {
  const parsed = bookFormSchema.safeParse(bookFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/books/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const slug = slugify(parsed.data.title);
  const created = await createBook({ ...parsed.data, slug });

  if (!created) {
    redirect(
      `/admin/books/new?error=${encodeURIComponent("Não foi possível salvar o livro. Verifique os dados e tente novamente.")}`
    );
  }

  revalidatePath("/admin/books");
  revalidatePath("/admin");
  redirect("/admin/books");
}

export async function updateBookAction(id: string, formData: FormData): Promise<void> {
  const parsed = bookFormSchema.safeParse(bookFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/books/${id}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const updated = await updateBook({ id, ...parsed.data });

  if (!updated) {
    redirect(
      `/admin/books/${id}/edit?error=${encodeURIComponent("Não foi possível salvar o livro. Verifique os dados e tente novamente.")}`
    );
  }

  revalidatePath("/admin/books");
  redirect("/admin/books");
}

export async function deleteBookAction(id: string): Promise<void> {
  await deleteBook(id);
  revalidatePath("/admin/books");
  revalidatePath("/admin");
  redirect("/admin/books");
}
