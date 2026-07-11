import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

import "./types";

/**
 * Configuração de autenticação do admin (Fase 1B — ativa).
 *
 * Este módulo descreve a configuração do Auth.js (padrão de "split config"),
 * consumida por `src/lib/auth/index.ts` (única instância `NextAuth(authConfig)`),
 * pela rota `/api/auth/[...nextauth]`, pelo `src/proxy.ts` e pela defesa em
 * profundidade em `src/app/admin/layout.tsx`.
 *
 * Modelo single-user: apenas o login do GitHub listado em ADMIN_GITHUB_LOGIN
 * é autorizado (allowlist verificada uma única vez, no callback `signIn`).
 * As credenciais AUTH_GITHUB_ID / AUTH_GITHUB_SECRET / AUTH_SECRET são lidas
 * automaticamente pelo Auth.js a partir do ambiente — o mesmo código serve
 * desenvolvimento (OAuth App local) e produção (OAuth App de produção), pois
 * o valor das variáveis muda por ambiente, não o código.
 */

function getAllowedLogin(): string | undefined {
  const login = process.env.ADMIN_GITHUB_LOGIN?.trim();
  return login ? login.toLowerCase() : undefined;
}

export const authConfig = {
  providers: [GitHub],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  // Necessário para funcionar em qualquer host (localhost em dev,
  // bookcringe.com.br em produção) sem depender de AUTH_URL fixo.
  trustHost: true,
  callbacks: {
    signIn({ profile }) {
      const allowed = getAllowedLogin();
      const login = (profile as { login?: string } | undefined)?.login?.toLowerCase();
      if (!allowed || !login) return false;
      return login === allowed;
    },
    jwt({ token, profile }) {
      const login = (profile as { login?: string } | undefined)?.login;
      if (typeof login === "string") {
        token.login = login;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.login = (token.login as string | null | undefined) ?? null;
      }
      return session;
    },
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
