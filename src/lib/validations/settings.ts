import { z } from "zod";

/**
 * Validação do formulário de Configurações do admin (módulo Configurações).
 * Mesmo padrão de `src/lib/validations/book.ts`/`bookclub.ts`: trim, limites
 * de tamanho, `preprocess` para tratar campo vazio como "sem valor".
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

function optionalUrl(label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().url(`${label} deve ser uma URL válida`).optional()
  );
}

function optionalUuid(label: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().uuid(`${label} inválido`).optional()
  );
}

export const settingsFormSchema = z.object({
  project_name: z
    .string()
    .trim()
    .min(1, "Nome do site é obrigatório")
    .max(150, "Nome do site deve ter no máximo 150 caracteres"),
  slogan: optionalText(200, "Slogan"),
  description: optionalText(500, "Descrição"),
  instagram_url: optionalUrl("Instagram"),
  tiktok_url: optionalUrl("TikTok"),
  youtube_url: optionalUrl("YouTube"),
  goodreads_url: optionalUrl("Goodreads"),
  linkedin_url: optionalUrl("LinkedIn"),
  personal_site_url: optionalUrl("Site pessoal"),
  amazon_associate_id: optionalText(50, "Associate ID"),
  amazon_url: optionalUrl("URL da loja Amazon"),
  hero_title: optionalText(150, "Título do Hero"),
  hero_subtitle: optionalText(250, "Subtítulo do Hero"),
  home_text: optionalText(5000, "Textos institucionais"),
  active_bookclub_year_id: optionalUuid("Ano ativo"),
  active_bookclub_month_id: optionalUuid("Mês ativo"),
});

export type SettingsFormInput = z.infer<typeof settingsFormSchema>;

export function settingsFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    project_name: formData.get("project_name"),
    slogan: formData.get("slogan"),
    description: formData.get("description"),
    instagram_url: formData.get("instagram_url"),
    tiktok_url: formData.get("tiktok_url"),
    youtube_url: formData.get("youtube_url"),
    goodreads_url: formData.get("goodreads_url"),
    linkedin_url: formData.get("linkedin_url"),
    personal_site_url: formData.get("personal_site_url"),
    amazon_associate_id: formData.get("amazon_associate_id"),
    amazon_url: formData.get("amazon_url"),
    hero_title: formData.get("hero_title"),
    hero_subtitle: formData.get("hero_subtitle"),
    home_text: formData.get("home_text"),
    active_bookclub_year_id: formData.get("active_bookclub_year_id"),
    active_bookclub_month_id: formData.get("active_bookclub_month_id"),
  };
}
