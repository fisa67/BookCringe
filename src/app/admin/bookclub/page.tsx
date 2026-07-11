import Link from "next/link";
import type { Metadata } from "next";
import { getBookClubMonths, getBookClubYears } from "@/lib/services/clubService";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteBookClubYearAction } from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Clube de Leitura — Admin BookCringe",
};

export default async function AdminBookClubPage() {
  const years = await getBookClubYears();

  const monthCounts = years
    ? await Promise.all(
        years.map(async (year) => {
          const months = await getBookClubMonths(year.id);
          return [year.id, months?.length ?? 0] as const;
        })
      )
    : [];
  const monthCountByYear = new Map(monthCounts);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Clube de Leitura</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Calendário do clube</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Gerencie os anos, meses e livros do calendário do clube de leitura.
            </p>
          </div>
          <Link
            href="/admin/bookclub/new"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Novo Ano
          </Link>
        </div>
      </div>

      {years === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os anos do clube. Tente novamente em alguns instantes.
        </p>
      ) : years.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhum ano cadastrado ainda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {years.map((year) => (
            <li
              key={year.id}
              className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-6"
            >
              <div>
                <p className="text-2xl font-semibold text-white">{year.year}</p>
                {year.title ? <p className="mt-1 text-sm text-slate-300">{year.title}</p> : null}
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {monthCountByYear.get(year.id) ?? 0} mês(es) cadastrado(s)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/bookclub/${year.id}`}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  Ver meses
                </Link>
                <Link
                  href={`/admin/bookclub/${year.id}/edit`}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Editar
                </Link>
                <ConfirmSubmitButton
                  action={deleteBookClubYearAction.bind(null, year.id)}
                  confirmMessage={`Excluir o ano ${year.year}? Isso também excluirá todos os meses e livros associados a ele. Esta ação não pode ser desfeita.`}
                  label="Excluir"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
