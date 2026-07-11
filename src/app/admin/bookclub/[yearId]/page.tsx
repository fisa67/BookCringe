import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBookClubMonthBooks,
  getBookClubMonths,
  getBookClubYearById,
} from "@/lib/services/clubService";
import { getMonthLabel } from "@/lib/admin/bookclubLabels";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  deleteBookClubMonthAction,
  deleteBookClubYearAction,
  setActiveBookClubMonthAction,
} from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Ano do clube — Admin BookCringe",
};

interface YearDetailPageProps {
  params: Promise<{ yearId: string }>;
}

export default async function YearDetailPage({ params }: YearDetailPageProps) {
  const { yearId } = await params;
  const year = await getBookClubYearById(yearId);

  if (!year) {
    notFound();
  }

  const months = await getBookClubMonths(yearId);
  const bookCounts = months
    ? await Promise.all(
        months.map(async (month) => {
          const books = await getBookClubMonthBooks(month.id);
          return [month.id, books?.length ?? 0] as const;
        })
      )
    : [];
  const bookCountByMonth = new Map(bookCounts);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Clube de Leitura</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {year.year}
              {year.title ? <span className="ml-2 text-xl text-slate-400">— {year.title}</span> : null}
            </h1>
            {year.notes ? <p className="mt-4 max-w-2xl text-slate-300">{year.notes}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/bookclub/${year.id}/edit`}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Editar ano
            </Link>
            <ConfirmSubmitButton
              action={deleteBookClubYearAction.bind(null, year.id)}
              confirmMessage={`Excluir o ano ${year.year}? Isso também excluirá todos os meses e livros associados a ele. Esta ação não pode ser desfeita.`}
              label="Excluir ano"
            />
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/admin/bookclub/${year.id}/new`}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Novo Mês
          </Link>
        </div>
      </div>

      {months === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os meses. Tente novamente em alguns instantes.
        </p>
      ) : months.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhum mês cadastrado ainda neste ano.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {months.map((month) => {
            const isActive = month.metadata?.is_active === true;

            return (
              <li
                key={month.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-6"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold text-white">{getMonthLabel(month.month)}</p>
                    {isActive ? (
                      <span className="rounded-full border border-emerald-800 bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        Mês ativo
                      </span>
                    ) : null}
                  </div>
                  {month.theme ? <p className="mt-1 text-sm text-slate-300">{month.theme}</p> : null}
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {bookCountByMonth.get(month.id) ?? 0} livro(s)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/bookclub/${year.id}/months/${month.id}`}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                  >
                    Ver livros
                  </Link>
                  <Link
                    href={`/admin/bookclub/${year.id}/months/${month.id}/edit`}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Editar
                  </Link>
                  {!isActive ? (
                    <form action={setActiveBookClubMonthAction.bind(null, year.id, month.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-700 hover:bg-emerald-950/70 hover:text-emerald-200"
                      >
                        Marcar como ativo
                      </button>
                    </form>
                  ) : null}
                  <ConfirmSubmitButton
                    action={deleteBookClubMonthAction.bind(null, year.id, month.id)}
                    confirmMessage={`Excluir ${getMonthLabel(month.month)}? Isso também excluirá os livros associados a este mês. Esta ação não pode ser desfeita.`}
                    label="Excluir"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
