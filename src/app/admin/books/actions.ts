"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { createBook, deleteBook, getBookById, updateBook } from "@/lib/services/bookService";
import {
  getReadingByBook,
  saveReading,
  clearRecommendationOfMonthExcept,
} from "@/lib/services/bookReadingService";
import { bookFormDataToInput, bookFormSchema } from "@/lib/validations/book";
import { readingFormDataToInput, readingFormSchema } from "@/lib/validations/reading";
import { formatValidationErrors } from "@/lib/validations/forms";
import { slugify } from "@/lib/utils";
import { parseHhMmSsToSeconds } from "@/lib/utils/time";

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

/**
 * Grava os dados de leitura (nota, favorito, recomendaria, resenha, tempo de
 * leitura, motivo da recomendação, recomendação do mês) a partir do card
 * "Dados de leitura" em `/admin/books/[id]/edit`. Reaproveita `saveReading`
 * (upsert por `book_id`, já usado por `completionService.
 * finalizeBookReading`) — não é uma via de escrita nova, apenas um segundo
 * chamador. `/api/complete-reading` continua funcionando sem qualquer
 * alteração de contrato.
 *
 * Campos fora do escopo desta tela (status, started_at/finished_at, format,
 * metadata) são preservados da leitura existente; ao criar a primeira
 * leitura de um livro (ainda sem registro), assumem defaults sensatos
 * (status "finished", finished_at hoje, format do livro).
 */
export async function saveReadingAction(bookId: string, formData: FormData): Promise<void> {
  const parsed = readingFormSchema.safeParse(readingFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/books/${bookId}/edit?readingError=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const [existingReading, book] = await Promise.all([getReadingByBook(bookId), getBookById(bookId)]);

  // `parseHhMmSsToSeconds` devolve `null` para ausente/inválido — nesse caso
  // caímos para o valor já persistido, nunca zerando o tempo de leitura só
  // porque o campo ficou em branco nesta edição.
  const parsedReadingTimeSeconds = parseHhMmSsToSeconds(parsed.data.reading_time);
  const readingTimeSeconds =
    parsedReadingTimeSeconds !== null
      ? String(parsedReadingTimeSeconds)
      : existingReading?.reading_time_seconds ?? undefined;

  // Precisa rodar ANTES do upsert: desmarca qualquer outro livro que esteja
  // com "Recomendação do mês" ativa para este aqui poder assumir o posto sem
  // colidir com o índice único parcial (no máximo 1 `true` por vez).
  if (parsed.data.is_recommendation_of_month) {
    await clearRecommendationOfMonthExcept(bookId);
  }

  const saved = await saveReading({
    book_id: bookId,
    rating: parsed.data.rating,
    review: parsed.data.review,
    favorite: parsed.data.favorite,
    would_recommend: parsed.data.would_recommend,
    recommendation_reason: parsed.data.recommendation_reason,
    is_recommendation_of_month: parsed.data.is_recommendation_of_month,
    reading_time_seconds: readingTimeSeconds,
    started_at: existingReading?.started_at,
    finished_at: existingReading?.finished_at ?? new Date().toISOString().slice(0, 10),
    status: existingReading?.status ?? "finished",
    format: existingReading?.format ?? book?.format,
    metadata: existingReading?.metadata ?? {},
  });

  if (!saved) {
    redirect(
      `/admin/books/${bookId}/edit?readingError=${encodeURIComponent("Não foi possível salvar os dados de leitura. Verifique os dados e tente novamente.")}`
    );
  }

  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}/edit`);
  revalidatePath("/estatisticas");
  revalidatePath("/biblioteca");
  revalidatePath("/recomendacoes");
  if (book?.slug) {
    revalidatePath(`/livro/${book.slug}`);
  }
  redirect(`/admin/books/${bookId}/edit`);
}
