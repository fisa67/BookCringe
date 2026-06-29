import { z } from "zod";
import { SITE_NAME } from "@/lib/constants";

const serverEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY é obrigatória"),
  CONTACT_EMAIL: z.string().email("CONTACT_EMAIL deve ser um e-mail válido"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${details}`);
  }

  return parsed.data;
}

export function getFromEmail(): string {
  const { CONTACT_EMAIL } = getServerEnv();
  return `${SITE_NAME} <${CONTACT_EMAIL}>`;
}
