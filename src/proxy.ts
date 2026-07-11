import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Proxy do admin (Fase 1B).
 *
 * Nomeado `proxy.ts` (não `middleware.ts`): desde o Next.js 16, a convenção
 * `middleware.ts` está deprecada em favor de `proxy.ts` (mesma API de
 * `matcher`, agora em runtime Node.js por padrão).
 *
 * Responsabilidade única: checagem OTIMISTA de sessão (lê o JWT do cookie,
 * sem tocar o banco) para as rotas /admin/*, redirecionando para
 * /admin/login quando não há sessão. `/admin/login` é explicitamente
 * excluída para não gerar loop de redirecionamento.
 *
 * A validação real (allowlist do GitHub) já ocorre uma única vez, no
 * callback `signIn` de `src/lib/auth/config.ts` — nenhuma sessão é criada
 * para um login fora da allowlist, então aqui basta checar presença de sessão.
 *
 * O header `x-bc-pathname` é propagado para os Server Components (usado pela
 * defesa em profundidade em `src/app/admin/layout.tsx`, que não tem acesso
 * direto ao pathname da rota atual).
 */
const ADMIN_LOGIN_PATH = "/admin/login";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-bc-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (pathname === ADMIN_LOGIN_PATH) {
    return response;
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.nextUrl));
  }

  return response;
});

export const config = {
  matcher: ["/admin/:path*"],
};
