import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookClubYearById } from "@/lib/services/clubService";
import { MonthForm } from "@/components/admin/bookclub/MonthForm";
import { createBookClubMonthAction } from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Novo mês — Admin BookCringe",
};

interface NewMonthPageProps {
  params: Promise<{ yearId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function NewMonthPage({ params, searchParams }: NewMonthPageProps) {
  const { yearId } = await params;
  const { error } = await searchParams;
  const year = await getBookClubYearById(yearId);

  if (!year) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
          Clube de Leitura — {year.year}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Novo mês</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <MonthForm
          action={createBookClubMonthAction.bind(null, year.id)}
          cancelHref={`/admin/bookclub/${year.id}`}
          submitLabel="Criar mês"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
