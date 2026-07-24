import { z } from "zod";

/**
 * Validação do formulário público de captação do "Clube dos Leitores
 * BookCringe" (`/api/newsletter`). `NEWSLETTER_SOURCES` precisa existir em
 * runtime (para `z.enum`) — mesma lista do `check` da migration
 * `20260724_newsletter_subscribers.sql` e de `NewsletterSource`
 * (`src/lib/types/cms.ts`).
 */
export const NEWSLETTER_SOURCES = ["home", "recommendations", "book", "contents"] as const;

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .max(254, "E-mail deve ter no máximo 254 caracteres")
    .email("Informe um e-mail válido"),
  source: z.enum(NEWSLETTER_SOURCES, {
    errorMap: () => ({ message: "Origem da inscrição inválida" }),
  }),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
