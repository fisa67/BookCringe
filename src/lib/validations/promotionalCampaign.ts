import { z } from "zod";

export const PROMOTIONAL_CAMPAIGN_ITEM_TYPES = ["book", "kindle", "accessory", "other"] as const;

function emptyToUndefined(value: unknown) {
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

const requiredMediaUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatória`)
    .max(500, `${label} deve ter no máximo 500 caracteres`)
    .refine((value) => isSafeCampaignUrl(value, true), `${label} deve ser uma URL http(s) ou um path local`);

const requiredExternalUrl = (label: string) =>
  z
    .string()
    .trim()
    .url(`${label} inválida`)
    .refine((value) => isSafeCampaignUrl(value), `${label} deve usar http:// ou https://`);

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

export const promotionalCampaignItemFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200, "Título muito longo"),
  image_url: requiredMediaUrl("Imagem"),
  description: optionalText(2000, "Descrição"),
  affiliate_url: requiredExternalUrl("Link da oferta"),
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
});

export type PromotionalCampaignItemFormInput = z.infer<typeof promotionalCampaignItemFormSchema>;

export function promotionalCampaignItemFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
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
