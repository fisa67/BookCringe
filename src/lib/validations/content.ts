import { z } from "zod";

/**
 * Validação do formulário de conteúdo do admin (módulo Conteúdo).
 * Segue o mesmo padrão de `src/lib/validations/book.ts` e `bookclub.ts`.
 *
 * As listas abaixo devem ficar em sincronia com `CmsContentPlatform` e
 * `CmsContentType` em `src/lib/types/cms.ts` (e com os `check` da migration
 * `20260708_initial_schema.sql`) — precisam existir em runtime (para
 * `z.enum` e para popular os `<select>` do formulário), o que um `type`
 * TypeScript puro não permite.
 */
export const CONTENT_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "spotify",
  "podcast",
  "blog",
  "website",
] as const;

export const CONTENT_TYPES = [
  "reel",
  "short",
  "video",
  "podcast",
  "article",
  "other",
  "youtube",
  "carousel",
  "review",
] as const;

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalText(max: number, label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `${label} deve ter no máximo ${max} caracteres`).optional()
  );
}

export const contentFormSchema = z.object({
  book_id: z.string().trim().min(1, "Selecione um livro").uuid("Livro inválido"),
  title: optionalText(200, "Título"),
  platform: z.enum(CONTENT_PLATFORMS, {
    errorMap: () => ({ message: "Selecione uma plataforma válida" }),
  }),
  content_type: z.enum(CONTENT_TYPES, {
    errorMap: () => ({ message: "Selecione um tipo de conteúdo válido" }),
  }),
  url: z.string().trim().min(1, "Link é obrigatório").url("Informe um link válido"),
  is_featured: z.preprocess((value) => value === "true" || value === "on", z.boolean()),
  published_at: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de publicação inválida")
      .optional()
  ),
  thumbnail_path: optionalText(500, "Thumbnail"),
});

export type ContentFormInput = z.infer<typeof contentFormSchema>;

export function contentFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    book_id: formData.get("book_id"),
    title: formData.get("title"),
    platform: formData.get("platform"),
    content_type: formData.get("content_type"),
    url: formData.get("url"),
    is_featured: formData.get("is_featured"),
    published_at: formData.get("published_at"),
    thumbnail_path: formData.get("thumbnail_path"),
  };
}
