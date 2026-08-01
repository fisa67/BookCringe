import type { Metadata } from "next";
import { IntelligenceNav } from "@/components/admin/intelligence/IntelligenceNav";

export const metadata: Metadata = {
  title: "Intelligence — Admin BookCringe",
};

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">BookCringe Intelligence</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Intelligence</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Estrutura administrativa para análise, importações, plataformas, IA, relatórios e configurações.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <IntelligenceNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
