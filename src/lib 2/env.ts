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

// ──────────────────────────────────────────────────────────────
// Supabase (backend do CMS) — validação sob demanda.
// Não é invocada no boot para não afetar o site público.
// ──────────────────────────────────────────────────────────────
const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL deve ser uma URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY é obrigatória"),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

export function getSupabaseEnv(): SupabaseEnv {
  const parsed = supabaseEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis do Supabase inválidas: ${details}`);
  }

  return parsed.data;
}

// ──────────────────────────────────────────────────────────────
// Autenticação do admin (GitHub OAuth) — Fase 1B.
// Fundação preparada; ainda NÃO é chamada em runtime.
// ──────────────────────────────────────────────────────────────
const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET é obrigatória"),
  AUTH_GITHUB_ID: z.string().min(1, "AUTH_GITHUB_ID é obrigatória"),
  AUTH_GITHUB_SECRET: z.string().min(1, "AUTH_GITHUB_SECRET é obrigatória"),
  ADMIN_GITHUB_LOGIN: z.string().min(1, "ADMIN_GITHUB_LOGIN é obrigatória"),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export function getAuthEnv(): AuthEnv {
  const parsed = authEnvSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    ADMIN_GITHUB_LOGIN: process.env.ADMIN_GITHUB_LOGIN,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de autenticação inválidas: ${details}`);
  }

  return parsed.data;
}
