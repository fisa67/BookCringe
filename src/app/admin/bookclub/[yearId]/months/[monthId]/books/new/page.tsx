import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookClubMonthById, getBookClubYearById } from "@/lib/services/clubService";
import { getBooks } from "@/lib/services/bookService";
import { getMonthLabel } from "@/lib/admin/bookclubLabels";
import { MonthBookForm } from "@/components/admin/bookclub/MonthBookForm";
import { createBookClubMonthBookAction } from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Adicionar livro — Admin BookCringe",
};

interface NewMonthBookPageProps {
  params: Promise<{ yearId: string; monthId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function NewMonthBookPage({ params, searchParams }: NewMonthBookPageProps) {
  const { yearId, monthId } = await params;
  const { error } = await searchParams;
  const year = await getBookClubYearById(yearId);
  const month = await getBookClubMonthById(monthId);

  if (!year || !month || month.year_id !== year.id) {
    notFound();
  }

  const books = (await getBooks()) ?? [];
  const cancelHref = `/admin/bookclub/${year.id}/months/${month.id}`;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
          Clube de Leitura — {year.year} · {getMonthLabel(month.month)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Adicionar livro</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <MonthBookForm
          action={createBookClubMonthBookAction.bind(null, year.id, month.id)}
          books={books}
          cancelHref={cancelHref}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
