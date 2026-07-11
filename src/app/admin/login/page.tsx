import type { Metadata } from "next";
import { signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login — Admin BookCringe",
  description: "Acesso restrito ao painel administrativo do BookCringe.",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Acesso restrito</p>
      <h1 className="text-3xl font-semibold text-white">Painel BookCringe</h1>
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/admin" });
        }}
      >
        <button
          type="submit"
          className="mt-2 rounded-md border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Entrar com GitHub
        </button>
      </form>
    </div>
  );
}
