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

/**
 * Categorias editoriais de conteúdo. `"book"` é reservada para conteúdo
 * sobre um livro específico (exige `book_id`) — as demais são usadas pelo
 * "Conteúdo geral" (sem livro associado). Mesma lista de
 * `CmsContentCategory` (`src/lib/types/cms.ts`) e do `check` da migration
 * `20260724_contents_general.sql`.
 */
export const CONTENT_CATEGORIES = [
  "book",
  "reading",
  "productivity",
  "community",
  "opinion",
  "other",
] as const;

/** Categorias disponíveis quando o autor escolhe "Conteúdo geral" no CMS — todas menos `"book"`. */
export const GENERAL_CONTENT_CATEGORIES = CONTENT_CATEGORIES.filter((category) => category !== "book");

/**
 * Tipo de associação do formulário — campo auxiliar, não persistido no
 * banco (a persistência real é `book_id` + `content_category`). Existe só
 * para orientar a UI (`ContentAssociationFields`) e a validação abaixo.
 */
export const CONTENT_ASSOCIATION_TYPES = ["book", "general"] as const;

/**
 * Trata tanto string vazia (`<input>` presente mas em branco) quanto `null`
 * (campo ausente do FormData — `FormData.get` de um nome que não existe no
 * DOM, ex.: `book_id` quando "Conteúdo geral" está selecionado) como "não
 * informado". Sem o segundo caso, `z.string().optional()` rejeita `null`
 * explicitamente ("Expected string, received null"), quebrando a validação
 * de qualquer campo que só existe condicionalmente no formulário
 * (`ContentAssociationFields`).
 */
function emptyToUndefined(value: unknown) {
  if (value === null) return undefined;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalText(max: number, label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `${label} deve ter no máximo ${max} caracteres`).optional()
  );
}

const optionalBookId = z.preprocess(emptyToUndefined, z.string().trim().uuid("Livro inválido").optional());
const optionalContentCategory = z.preprocess(
  emptyToUndefined,
  z.enum(CONTENT_CATEGORIES, { errorMap: () => ({ message: "Selecione uma categoria válida" }) }).optional()
);

export const contentFormSchema = z
  .object({
    association_type: z.enum(CONTENT_ASSOCIATION_TYPES, {
      errorMap: () => ({ message: "Selecione o tipo de associação" }),
    }),
    book_id: optionalBookId,
    content_category: optionalContentCategory,
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
  })
  .superRefine((data, ctx) => {
    if (data.association_type === "book") {
      if (!data.book_id) {
        ctx.addIssue({ code: "custom", path: ["book_id"], message: "Selecione um livro" });
      }
    } else if (data.content_category === undefined || data.content_category === "book") {
      ctx.addIssue({
        code: "custom",
        path: ["content_category"],
        message: "Selecione uma categoria para o conteúdo geral",
      });
    }
  })
  .transform((data) => ({
    ...data,
    book_id: data.association_type === "book" ? data.book_id ?? null : null,
    content_category: data.association_type === "book" ? ("book" as const) : data.content_category!,
    // Conteúdo sobre um livro não tem mais campo de título manual (a Biblioteca
    // já é a fonte do título exibido publicamente, via `content.book?.title`) —
    // qualquer valor vindo do form nesse fluxo é ignorado. "Conteúdo geral"
    // continua livre para digitar um título, pois não tem livro para derivar.
    title: data.association_type === "book" ? undefined : data.title,
  }));

export type ContentFormInput = z.infer<typeof contentFormSchema>;

export function contentFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    association_type: formData.get("association_type"),
    book_id: formData.get("book_id"),
    content_category: formData.get("content_category"),
    title: formData.get("title"),
    platform: formData.get("platform"),
    content_type: formData.get("content_type"),
    url: formData.get("url"),
    is_featured: formData.get("is_featured"),
    published_at: formData.get("published_at"),
    thumbnail_path: formData.get("thumbnail_path"),
  };
}
