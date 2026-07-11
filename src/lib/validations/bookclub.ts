import { z } from "zod";

/**
 * Validação dos formulários do módulo Clube de Leitura (admin).
 * Segue o mesmo padrão de `src/lib/validations/book.ts`.
 */

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalText(max: number, label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `${label} deve ter no máximo ${max} caracteres`).optional()
  );
}

function optionalDate(label: string) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} inválida`)
      .optional()
  );
}

export const bookClubYearFormSchema = z.object({
  year: z.coerce
    .number({ message: "Ano deve ser um número" })
    .int("Ano deve ser um número inteiro")
    .min(1900, "Ano inválido")
    .max(3000, "Ano inválido"),
  title: optionalText(150, "Título"),
  notes: optionalText(2000, "Notas"),
});

export type BookClubYearFormInput = z.infer<typeof bookClubYearFormSchema>;

export function bookClubYearFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    year: formData.get("year"),
    title: formData.get("title"),
    notes: formData.get("notes"),
  };
}

export const bookClubMonthFormSchema = z.object({
  month: z.coerce
    .number({ message: "Mês deve ser um número" })
    .int("Mês deve ser um número inteiro")
    .min(1, "Mês deve ser entre 1 e 12")
    .max(12, "Mês deve ser entre 1 e 12"),
  theme: optionalText(150, "Tema"),
  notes: optionalText(2000, "Notas"),
  start_date: optionalDate("Data de início"),
  end_date: optionalDate("Data de término"),
});

export type BookClubMonthFormInput = z.infer<typeof bookClubMonthFormSchema>;

export function bookClubMonthFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    month: formData.get("month"),
    theme: formData.get("theme"),
    notes: formData.get("notes"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  };
}

export const bookClubMonthBookFormSchema = z.object({
  book_id: z.string().trim().min(1, "Selecione um livro").uuid("Livro inválido"),
  position: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "Posição deve ser um número" })
      .int("Posição deve ser um número inteiro")
      .min(0, "Posição inválida")
      .optional()
  ),
});

export type BookClubMonthBookFormInput = z.infer<typeof bookClubMonthBookFormSchema>;

export function bookClubMonthBookFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    book_id: formData.get("book_id"),
    position: formData.get("position"),
  };
}
