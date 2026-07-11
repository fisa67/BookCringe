import type { Metadata } from "next";
import { YearForm } from "@/components/admin/bookclub/YearForm";
import { createBookClubYearAction } from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Novo ano — Admin BookCringe",
};

interface NewYearPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewYearPage({ searchParams }: NewYearPageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Clube de Leitura</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Novo ano</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <YearForm action={createBookClubYearAction} submitLabel="Criar ano" errorMessage={error} />
      </div>
    </div>
  );
}
