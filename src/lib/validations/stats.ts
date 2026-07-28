import { z } from "zod";

/**
 * Validação do formulário de meta anual (`/admin/stats`) — único campo de
 * escrita que resta em `statistics` (ver `completionService`: `books_read`/
 * `pages_read`/demais contadores não são mais mantidos pelo app).
 * `z.coerce.number()` porque `FormData` sempre entrega string.
 */
export const statsFormSchema = z.object({
  year: z.coerce
    .number({ invalid_type_error: "Informe um ano válido" })
    .int("Ano deve ser um número inteiro")
    .min(2000, "Ano deve ser a partir de 2000")
    .max(2100, "Ano deve ser até 2100"),
  annual_goal: z.coerce
    .number({ invalid_type_error: "Informe uma meta válida" })
    .int("Meta deve ser um número inteiro")
    .min(1, "Meta deve ser pelo menos 1")
    .max(1000, "Meta deve ser no máximo 1000"),
});

export type StatsFormInput = z.infer<typeof statsFormSchema>;

export function statsFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    year: formData.get("year"),
    annual_goal: formData.get("annual_goal"),
  };
}
