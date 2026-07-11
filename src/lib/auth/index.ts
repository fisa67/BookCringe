import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

/**
 * Instância única do Auth.js (Fase 1B).
 *
 * Todo o resto do app (rota `/api/auth`, `src/proxy.ts`, `src/app/admin/login`
 * e a defesa em profundidade em `src/app/admin/layout.tsx`) importa `auth`
 * (e, quando necessário, `signIn`/`signOut`) a partir deste módulo — nunca
 * instancia `NextAuth(authConfig)` de novo, para evitar múltiplas instâncias
 * e lógica de autenticação duplicada.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
