import { auth } from "@/lib/auth";

/**
 * Identidade usada como fronteira de tenant no Intelligence (Sprint
 * "Multi-Tenant Foundation"). Hoje é o mesmo valor de sessão que já
 * alimenta o allowlist do GitHub (`session.user.login`, ver
 * `lib/auth/config.ts`) — nenhuma tabela de usuários nova foi criada para
 * esta sprint. Convites/múltiplos administradores continuam fora de
 * escopo; o que muda é que os dados de cada criador passam a ser isolados
 * pelo `owner_id` gravado em `intelligence_datasets`.
 */
export async function getOwnerId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.login ?? null;
}

/**
 * Mesma coisa que `getOwnerId`, mas para os pontos que já pressupõem uma
 * sessão válida (páginas/Server Actions do admin, sempre atrás de
 * `assertAdminSession` em `app/admin/layout.tsx`) — lança em vez de deixar
 * o `ownerId` seguir como `null` até uma query que filtraria "tudo".
 */
export async function requireOwnerId(): Promise<string> {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    throw new Error("Sessão inválida: nenhum usuário autenticado (owner_id ausente).");
  }
  return ownerId;
}
