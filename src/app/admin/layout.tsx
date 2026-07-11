import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin BookCringe",
  description: "Painel administrativo do BookCringe",
};

const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Defesa em profundidade (Fase 1B): reutiliza o `auth()` centralizado em
 * `src/lib/auth/index.ts` — a mesma checagem de sessão do `src/proxy.ts` —
 * para não depender exclusivamente do proxy, conforme a recomendação
 * oficial do Next.js ("Proxy should not be your only line of defense").
 *
 * `/admin/login` é excluída via o header `x-bc-pathname` (propagado pelo
 * proxy), já que um layout não recebe o pathname da rota atual diretamente.
 * Sem essa exclusão, o próprio redirecionamento para `/admin/login` cairia
 * em loop.
 */
async function assertAdminSession() {
  const pathname = (await headers()).get("x-bc-pathname");
  if (pathname === ADMIN_LOGIN_PATH) {
    return;
  }

  const session = await auth();
  if (!session) {
    redirect(ADMIN_LOGIN_PATH);
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdminSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Administração</p>
            <h1 className="text-2xl font-semibold">BookCringe CMS</h1>
          </div>
          <Link
            href="/"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            Ver site público
          </Link>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
