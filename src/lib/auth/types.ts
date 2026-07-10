import type { DefaultSession } from "next-auth";

/**
 * Tipos de autenticação do admin (Fase 1A — fundação).
 *
 * Modelo single-user: o único administrador autoriza-se via GitHub OAuth.
 * A identidade relevante é o `login` (username) do GitHub, comparado com a
 * allowlist definida em `ADMIN_GITHUB_LOGIN`.
 *
 * Estes tipos apenas descrevem o contrato da sessão. A ativação (handlers,
 * middleware, rota) acontece na Fase 1B.
 */

/** Dados do administrador expostos na sessão. */
export interface AdminUser {
  /** Username público do GitHub (ex.: "octocat"). */
  login: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      login?: string | null;
    } & DefaultSession["user"];
  }
}

// Obs.: o tipo JWT do Auth.js v5 já estende Record<string, unknown>, então
// campos extras (como `login`) podem ser gravados sem augmentation dedicada.
