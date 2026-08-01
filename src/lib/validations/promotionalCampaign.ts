import { z } from "zod";

export const PROMOTIONAL_CAMPAIGN_ITEM_TYPES = ["book", "kindle", "accessory", "other"] as const;

/**
 * Subconjunto de tipos que o admin pode escolher manualmente — `"book"` é
 * reservado para itens vinculados a um livro da Biblioteca (`book_id`
 * presente) e passa a ser atribuído automaticamente pelo schema, nunca
 * selecionado à mão (ver `promotionalCampaignItemFormSchema`).
 */
export const MANUAL_PROMOTIONAL_CAMPAIGN_ITEM_TYPES = PROMOTIONAL_CAMPAIGN_ITEM_TYPES.filter(
  (type) => type !== "book"
);

/** Como o admin está cadastrando o item — campo auxiliar do formulário, não persistido (a persistência real é `book_id`). */
export const PROMOTIONAL_CAMPAIGN_ITEM_SOURCES = ["book", "manual"] as const;

/**
 * Trata tanto string vazia quanto `null` (campo ausente do FormData — ex.:
 * `book_id` quando "Cadastrar manualmente" está selecionado) como "não
 * informado". Mesma correção aplicada em `content.ts`
 * (`contentFormSchema`) pelo mesmo motivo: `z.string().optional()` rejeita
 * `null` explicitamente.
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

function isSafeCampaignUrl(value: string, allowRelative = false): boolean {
  if (allowRelative && value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const optionalMediaUrl = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(500, `${label} deve ter no máximo 500 caracteres`)
      .refine((value) => isSafeCampaignUrl(value, true), `${label} deve ser uma URL http(s) ou um path local`)
      .optional()
  );

const activeField = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean()
);

export const promotionalCampaignFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da campanha").max(150, "Nome muito longo"),
  slug: z
    .string()
    .trim()
    .min(1, "Informe o slug")
    .max(80, "Slug muito longo")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens"),
  description: optionalText(2000, "Descrição"),
  banner_url: optionalMediaUrl("Banner"),
  is_active: activeField,
});

export type PromotionalCampaignFormInput = z.infer<typeof promotionalCampaignFormSchema>;

export function promotionalCampaignFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    banner_url: formData.get("banner_url"),
    is_active: formData.get("is_active"),
  };
}

/**
 * Item de campanha: `source_type` decide se o item é "vinculado ao CMS"
 * (`book_id`, dados resolvidos via join com `books` — ver
 * `src/lib/campaigns.ts#resolveCampaignItem`) ou "manual" (título/imagem/
 * descrição/link próprios, para produtos que não existem na Biblioteca —
 * Kindle, acessórios etc.). Mesmo padrão de `contentFormSchema`
 * (`association_type` + `.superRefine` + `.transform`).
 */
export const promotionalCampaignItemFormSchema = z
  .object({
    source_type: z.enum(PROMOTIONAL_CAMPAIGN_ITEM_SOURCES, {
      errorMap: () => ({ message: "Selecione como cadastrar este item" }),
    }),
    book_id: z.preprocess(emptyToUndefined, z.string().trim().uuid("Livro inválido").optional()),
    title: optionalText(200, "Título"),
    image_url: optionalMediaUrl("Imagem"),
    description: optionalText(2000, "Descrição"),
    affiliate_url: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .url("Link da oferta inválido")
        .refine((value) => isSafeCampaignUrl(value), "Link da oferta deve usar http:// ou https://")
        .optional()
    ),
    price: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ message: "Preço inválido" }).min(0, "Preço não pode ser negativo").optional()
    ),
    position: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ message: "Ordem inválida" })
        .int("Ordem deve ser um número inteiro")
        .min(0, "Ordem não pode ser negativa")
        .optional()
    ),
    is_active: activeField,
    item_type: z.enum(PROMOTIONAL_CAMPAIGN_ITEM_TYPES, {
      errorMap: () => ({ message: "Tipo de item inválido" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.source_type === "book") {
      if (!data.book_id) {
        ctx.addIssue({ code: "custom", path: ["book_id"], message: "Selecione um livro" });
      }
      return;
    }

    if (!data.title) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Informe o título" });
    }
    if (!data.image_url) {
      ctx.addIssue({ code: "custom", path: ["image_url"], message: "Informe a imagem" });
    }
    if (!data.affiliate_url) {
      ctx.addIssue({ code: "custom", path: ["affiliate_url"], message: "Informe o link afiliado" });
    }
  })
  .transform((data) => ({
    ...data,
    book_id: data.source_type === "book" ? data.book_id ?? null : null,
    title: data.source_type === "book" ? null : data.title ?? null,
    image_url: data.source_type === "book" ? null : data.image_url ?? null,
    description: data.source_type === "book" ? null : data.description ?? null,
    affiliate_url: data.source_type === "book" ? null : data.affiliate_url ?? null,
    // Itens vinculados a um livro são sempre categorizados como "book" —
    // o select de tipo só existe (e só é enviado) no fluxo manual.
    item_type: data.source_type === "book" ? ("book" as const) : data.item_type,
  }));

export type PromotionalCampaignItemFormInput = z.infer<typeof promotionalCampaignItemFormSchema>;

export function promotionalCampaignItemFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    source_type: formData.get("source_type"),
    book_id: formData.get("book_id"),
    title: formData.get("title"),
    image_url: formData.get("image_url"),
    description: formData.get("description"),
    affiliate_url: formData.get("affiliate_url"),
    price: formData.get("price"),
    position: formData.get("position"),
    is_active: formData.get("is_active"),
    item_type: formData.get("item_type"),
  };
}
