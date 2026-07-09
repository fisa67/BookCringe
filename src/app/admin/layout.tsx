import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin BookCringe",
  description: "Painel administrativo do BookCringe",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
