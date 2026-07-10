import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

import "./types";

/**
 * Configuração de autenticação do admin (Fase 1A — fundação).
 *
 * Este módulo apenas descreve a configuração do Auth.js (padrão de "split
 * config"). Ele é INERTE: nada o importa em runtime ainda. A ativação
 * (NextAuth(authConfig), rota /api/auth, middleware e /admin/login) acontece
 * na Fase 1B.
 *
 * Modelo single-user: apenas o login do GitHub listado em ADMIN_GITHUB_LOGIN
 * é autorizado. As credenciais AUTH_GITHUB_ID / AUTH_GITHUB_SECRET / AUTH_SECRET
 * são lidas automaticamente pelo Auth.js a partir do ambiente.
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
