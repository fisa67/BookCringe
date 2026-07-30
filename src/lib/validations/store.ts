import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalText(max: number, label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `${label} deve ter no máximo ${max} caracteres`).optional()
  );
}

function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const activeField = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean()
);

export const storeCollectionFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da coleção").max(150, "Nome muito longo"),
  description: optionalText(2000, "Descrição"),
  is_active: activeField,
});

export type StoreCollectionFormInput = z.infer<typeof storeCollectionFormSchema>;

export function storeCollectionFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    is_active: formData.get("is_active"),
  };
}

export const storeProductFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto").max(200, "Nome muito longo"),
  description: optionalText(2000, "Descrição"),
  image_url: z
    .string()
    .trim()
    .min(1, "Informe a imagem")
    .max(500, "Imagem deve ter no máximo 500 caracteres")
    .refine(isSafeMediaUrl, "Imagem deve ser uma URL http(s) ou um path local"),
  price: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number({ message: "Preço inválido" }).min(0, "Preço não pode ser negativo")
  ),
  quantity: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce
      .number({ message: "Quantidade inválida" })
      .int("Quantidade deve ser um número inteiro")
      .min(0, "Quantidade não pode ser negativa")
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
  crew_exclusive: activeField,
});

export type StoreProductFormInput = z.infer<typeof storeProductFormSchema>;

export function storeProductFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    image_url: formData.get("image_url"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    position: formData.get("position"),
    is_active: formData.get("is_active"),
    crew_exclusive: formData.get("crew_exclusive"),
  };
}
