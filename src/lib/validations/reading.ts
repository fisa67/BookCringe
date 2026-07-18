import { z } from "zod";

/**
 * Validação do formulário de dados de leitura do admin (segundo card de
 * `/admin/books/[id]/edit`, ao lado de `BookForm`). Mesmo padrão de
 * `src/lib/validations/book.ts`/`content.ts`: preprocess para tratar string
 * vazia como "não informado" e `formatValidationErrors` para extrair
 * mensagens por campo.
 *
 * Escopo intencionalmente restrito aos 5 campos editáveis nesta tela
 * (rating, favorite, would_recommend, review, reading_time) — status,
 * started_at/finished_at e format continuam sendo geridos pelo fluxo de
 * finalização (`completionService.finalizeBookReading`, via
 * `/api/complete-reading`) ou preservados como estão.
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

export const readingFormSchema = z.object({
  rating: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "Nota deve ser um número" })
      .min(0, "Nota deve estar entre 0 e 5")
      .max(5, "Nota deve estar entre 0 e 5")
      .optional()
  ),
  favorite: z.preprocess((value) => value === "true" || value === "on", z.boolean()),
  would_recommend: z.preprocess((value) => value === "true" || value === "on", z.boolean()),
  review: optionalText(5000, "Resenha"),
  // Tempo total de leitura digitado no formato "H:MM:SS" — mesma regex de
  // `readingTime` em `src/app/api/complete-reading/route.ts`, para manter os
  // dois pontos de entrada consistentes. Convertido para segundos em
  // `saveReadingAction` via `parseHhMmSsToSeconds`, nunca guardado como string.
  reading_time: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d+:[0-5]\d:[0-5]\d$/, "Tempo de leitura deve estar no formato H:MM:SS")
      .optional()
  ),
});

export type ReadingFormInput = z.infer<typeof readingFormSchema>;

/** Extrai os campos do formulário de leitura a partir de um FormData. */
export function readingFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    rating: formData.get("rating"),
    favorite: formData.get("favorite"),
    would_recommend: formData.get("would_recommend"),
    review: formData.get("review"),
    reading_time: formData.get("reading_time"),
  };
}
