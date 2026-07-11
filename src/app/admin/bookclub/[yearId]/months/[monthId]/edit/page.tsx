import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookClubMonthById, getBookClubYearById } from "@/lib/services/clubService";
import { getMonthLabel } from "@/lib/admin/bookclubLabels";
import { MonthForm } from "@/components/admin/bookclub/MonthForm";
import { updateBookClubMonthAction } from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Editar mês — Admin BookCringe",
};

interface EditMonthPageProps {
  params: Promise<{ yearId: string; monthId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditMonthPage({ params, searchParams }: EditMonthPageProps) {
  const { yearId, monthId } = await params;
  const { error } = await searchParams;
  const year = await getBookClubYearById(yearId);
  const month = await getBookClubMonthById(monthId);

  if (!year || !month || month.year_id !== year.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
          Clube de Leitura — {year.year}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Editar {getMonthLabel(month.month)}
        </h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <MonthForm
          action={updateBookClubMonthAction.bind(null, year.id, month.id)}
          month={month}
          cancelHref={`/admin/bookclub/${year.id}/months/${month.id}`}
          submitLabel="Salvar alterações"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
