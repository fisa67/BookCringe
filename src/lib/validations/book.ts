import { z } from "zod";

/**
 * Validação do formulário de livro do admin (módulo Biblioteca).
 * Reaproveita o padrão dos schemas em `src/lib/validations/forms.ts`
 * (trim, limites de tamanho, `formatValidationErrors` para extrair mensagens).
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

function optionalInt(label: string, min: number, max: number) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: `${label} deve ser um número` })
      .int(`${label} deve ser um número inteiro`)
      .min(min, `${label} inválido`)
      .max(max, `${label} inválido`)
      .optional()
  );
}

function optionalUrl(label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().url(`${label} deve ser uma URL válida`).optional()
  );
}

export const bookFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  author: z
    .string()
    .trim()
    .min(1, "Autor é obrigatório")
    .max(150, "Autor deve ter no máximo 150 caracteres"),
  subtitle: optionalText(200, "Subtítulo"),
  publisher: optionalText(150, "Editora"),
  publication_year: optionalInt("Ano de publicação", 0, 3000),
  isbn: optionalText(32, "ISBN"),
  page_count: optionalInt("Número de páginas", 0, 100000),
  format: optionalText(50, "Formato"),
  language: optionalText(50, "Idioma"),
  country: optionalText(80, "País"),
  genres: z.preprocess(
    (value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((genre) => genre.trim())
            .filter(Boolean)
        : value,
    z.array(z.string().max(50)).max(20, "No máximo 20 gêneros").optional()
  ),
  amazon_url: optionalUrl("URL da Amazon"),
  cover_path: optionalText(500, "Capa"),
  notes: optionalText(2000, "Notas"),
});

export type BookFormInput = z.infer<typeof bookFormSchema>;

/** Extrai os campos do formulário de livro a partir de um FormData. */
export function bookFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    title: formData.get("title"),
    author: formData.get("author"),
    subtitle: formData.get("subtitle"),
    publisher: formData.get("publisher"),
    publication_year: formData.get("publication_year"),
    isbn: formData.get("isbn"),
    page_count: formData.get("page_count"),
    format: formData.get("format"),
    language: formData.get("language"),
    country: formData.get("country"),
    genres: formData.get("genres"),
    amazon_url: formData.get("amazon_url"),
    cover_path: formData.get("cover_path"),
    notes: formData.get("notes"),
  };
}
