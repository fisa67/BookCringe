import { z } from "zod";

/**
 * Validação do formulário de campanha (`/admin/newsletters/new` e
 * `/[id]/edit`) — mesmo padrão de `src/lib/validations/content.ts`.
 * `content` é o HTML sanitizado produzido pelo editor Rich Text; a validação
 * de tags, atributos e protocolos acontece na Server Action antes da
 * persistência.
 */
export const newsletterCampaignFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Título interno é obrigatório")
    .max(150, "Título deve ter no máximo 150 caracteres"),
  subject: z
    .string()
    .trim()
    .min(1, "Assunto do e-mail é obrigatório")
    .max(200, "Assunto deve ter no máximo 200 caracteres"),
  content: z
    .string()
    .trim()
    .min(1, "Conteúdo é obrigatório")
    .max(20000, "Conteúdo deve ter no máximo 20.000 caracteres"),
});

export type NewsletterCampaignFormInput = z.infer<typeof newsletterCampaignFormSchema>;

export function newsletterCampaignFormDataToInput(formData: FormData): Record<string, unknown> {
  return {
    title: formData.get("title"),
    subject: formData.get("subject"),
    content: formData.get("content"),
  };
}
