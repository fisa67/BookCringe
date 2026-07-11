"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import {
  createBookClubMonth,
  createBookClubMonthBook,
  createBookClubYear,
  deleteBookClubMonth,
  deleteBookClubMonthBook,
  deleteBookClubYear,
  getBookClubMonthBooks,
  getBookClubMonthById,
  setActiveBookClubMonth,
  setFeaturedBookClubMonthBook,
  updateBookClubMonth,
  updateBookClubYear,
} from "@/lib/services/clubService";
import {
  bookClubMonthBookFormDataToInput,
  bookClubMonthBookFormSchema,
  bookClubMonthFormDataToInput,
  bookClubMonthFormSchema,
  bookClubYearFormDataToInput,
  bookClubYearFormSchema,
} from "@/lib/validations/bookclub";
import { formatValidationErrors } from "@/lib/validations/forms";

/**
 * Server Actions do módulo Clube de Leitura — única porta de escrita usada
 * pela UI. Toda a persistência passa por `src/lib/services/clubService.ts`;
 * nenhum componente acessa o Supabase diretamente.
 *
 * Mesma filosofia do módulo Biblioteca (Fase anterior): validação primária
 * via HTML nativo, Zod como autoridade final, erro comunicado via `?error=`
 * no redirect (sem `useActionState`/estado client extra).
 */

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

// ─────────────────────────────────────────────
// Anos
// ─────────────────────────────────────────────

export async function createBookClubYearAction(formData: FormData): Promise<void> {
  const parsed = bookClubYearFormSchema.safeParse(bookClubYearFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/bookclub/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const created = await createBookClubYear({ ...parsed.data, metadata: {} });

  if (!created) {
    redirect(
      `/admin/bookclub/new?error=${encodeURIComponent("Não foi possível criar o ano. Ele pode já existir.")}`
    );
  }

  revalidatePath("/admin/bookclub");
  revalidatePath("/admin");
  redirect(`/admin/bookclub/${created.id}`);
}

export async function updateBookClubYearAction(yearId: string, formData: FormData): Promise<void> {
  const parsed = bookClubYearFormSchema.safeParse(bookClubYearFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/bookclub/${yearId}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const updated = await updateBookClubYear({ id: yearId, ...parsed.data });

  if (!updated) {
    redirect(
      `/admin/bookclub/${yearId}/edit?error=${encodeURIComponent("Não foi possível salvar o ano. Ele pode já existir.")}`
    );
  }

  revalidatePath("/admin/bookclub");
  revalidatePath(`/admin/bookclub/${yearId}`);
  redirect(`/admin/bookclub/${yearId}`);
}

export async function deleteBookClubYearAction(yearId: string): Promise<void> {
  await deleteBookClubYear(yearId);
  revalidatePath("/admin/bookclub");
  revalidatePath("/admin");
  redirect("/admin/bookclub");
}

// ─────────────────────────────────────────────
// Meses
// ─────────────────────────────────────────────

export async function createBookClubMonthAction(yearId: string, formData: FormData): Promise<void> {
  const parsed = bookClubMonthFormSchema.safeParse(bookClubMonthFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/bookclub/${yearId}/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const { start_date, end_date, ...rest } = parsed.data;
  const metadata: Record<string, unknown> = {};
  if (start_date) metadata.start_date = start_date;
  if (end_date) metadata.end_date = end_date;

  const created = await createBookClubMonth({ year_id: yearId, ...rest, metadata });

  if (!created) {
    redirect(
      `/admin/bookclub/${yearId}/new?error=${encodeURIComponent("Não foi possível criar o mês. O número do mês pode já estar em uso neste ano.")}`
    );
  }

  revalidatePath(`/admin/bookclub/${yearId}`);
  revalidatePath("/admin");
  redirect(`/admin/bookclub/${yearId}`);
}

export async function updateBookClubMonthAction(
  yearId: string,
  monthId: string,
  formData: FormData
): Promise<void> {
  const parsed = bookClubMonthFormSchema.safeParse(bookClubMonthFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/bookclub/${yearId}/months/${monthId}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const current = await getBookClubMonthById(monthId);

  if (!current) {
    redirect(
      `/admin/bookclub/${yearId}?error=${encodeURIComponent("Mês não encontrado.")}`
    );
  }

  const { start_date, end_date, ...rest } = parsed.data;
  const metadata: Record<string, unknown> = { ...current.metadata };
  if (start_date) {
    metadata.start_date = start_date;
  } else {
    delete metadata.start_date;
  }
  if (end_date) {
    metadata.end_date = end_date;
  } else {
    delete metadata.end_date;
  }

  const updated = await updateBookClubMonth({ id: monthId, ...rest, metadata });

  if (!updated) {
    redirect(
      `/admin/bookclub/${yearId}/months/${monthId}/edit?error=${encodeURIComponent("Não foi possível salvar o mês. O número do mês pode já estar em uso neste ano.")}`
    );
  }

  revalidatePath(`/admin/bookclub/${yearId}`);
  revalidatePath(`/admin/bookclub/${yearId}/months/${monthId}`);
  redirect(`/admin/bookclub/${yearId}/months/${monthId}`);
}

export async function deleteBookClubMonthAction(yearId: string, monthId: string): Promise<void> {
  await deleteBookClubMonth(monthId);
  revalidatePath(`/admin/bookclub/${yearId}`);
  revalidatePath("/admin");
  redirect(`/admin/bookclub/${yearId}`);
}

export async function setActiveBookClubMonthAction(yearId: string, monthId: string): Promise<void> {
  await setActiveBookClubMonth(monthId);
  revalidatePath(`/admin/bookclub/${yearId}`);
  revalidatePath(`/admin/bookclub/${yearId}/months/${monthId}`);
  redirect(`/admin/bookclub/${yearId}/months/${monthId}`);
}

// ─────────────────────────────────────────────
// Livros do mês
// ─────────────────────────────────────────────

export async function createBookClubMonthBookAction(
  yearId: string,
  monthId: string,
  formData: FormData
): Promise<void> {
  const parsed = bookClubMonthBookFormSchema.safeParse(bookClubMonthBookFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/bookclub/${yearId}/months/${monthId}/books/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  let position = parsed.data.position;
  if (position === undefined) {
    const existing = await getBookClubMonthBooks(monthId);
    position = existing && existing.length > 0 ? Math.max(...existing.map((book) => book.position)) + 1 : 0;
  }

  const created = await createBookClubMonthBook({
    month_id: monthId,
    book_id: parsed.data.book_id,
    position,
  });

  if (!created) {
    redirect(
      `/admin/bookclub/${yearId}/months/${monthId}/books/new?error=${encodeURIComponent("Não foi possível adicionar o livro. Ele pode já estar neste mês.")}`
    );
  }

  revalidatePath(`/admin/bookclub/${yearId}/months/${monthId}`);
  redirect(`/admin/bookclub/${yearId}/months/${monthId}`);
}

export async function deleteBookClubMonthBookAction(
  yearId: string,
  monthId: string,
  monthBookId: string
): Promise<void> {
  await deleteBookClubMonthBook(monthBookId);
  revalidatePath(`/admin/bookclub/${yearId}/months/${monthId}`);
  redirect(`/admin/bookclub/${yearId}/months/${monthId}`);
}

export async function setFeaturedBookClubMonthBookAction(
  yearId: string,
  monthId: string,
  monthBookId: string
): Promise<void> {
  await setFeaturedBookClubMonthBook(monthId, monthBookId);
  revalidatePath(`/admin/bookclub/${yearId}/months/${monthId}`);
  redirect(`/admin/bookclub/${yearId}/months/${monthId}`);
}
