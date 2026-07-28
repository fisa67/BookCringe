import type { Metadata } from "next";
import { getStatisticsByYear } from "@/lib/services/statsService";
import { getFinishedReadingsCountByYear } from "@/lib/services/bookReadingService";
import { updateAnnualGoalAction } from "@/app/admin/stats/actions";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Estatísticas — Admin BookCringe",
};

const DEFAULT_ANNUAL_GOAL = 52;

interface AdminStatsPageProps {
  searchParams: Promise<{ year?: string; error?: string; success?: string }>;
}

/**
 * Painel da meta anual de leitura (`statistics.annual_goal`) — única coisa
 * que resta gerenciável em `statistics` (ver `completionService`:
 * `books_read`/`pages_read`/demais contadores não são mais mantidos pelo
 * app). Livros concluídos e progresso são sempre lidos ao vivo de
 * `book_readings` — mesma fonte de verdade de `/estatisticas`
 * (`readingStatsPublicAdapter`) — nunca de `statistics`, para os dois
 * lugares nunca divergirem.
 */
export default async function AdminStatsPage({ searchParams }: AdminStatsPageProps) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number.isInteger(Number(params.year)) && params.year ? Number(params.year) : currentYear;

  const [statistics, booksCompleted] = await Promise.all([
    getStatisticsByYear(year),
    getFinishedReadingsCountByYear(year),
  ]);

  const annualGoal = statistics?.annual_goal ?? DEFAULT_ANNUAL_GOAL;
  const completed = booksCompleted ?? 0;
  const progressPct = annualGoal > 0 ? Math.min(100, Math.round((completed / annualGoal) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Estatísticas</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Meta anual de leitura</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Defina a meta de livros para o ano em <code className="text-slate-200">statistics.annual_goal</code>.
          Livros concluídos e progresso vêm sempre ao vivo de <code className="text-slate-200">book_readings</code>,
          a mesma fonte usada pela página pública <code className="text-slate-200">/estatisticas</code>.
        </p>
      </div>

      {params.success ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-4 text-sm text-emerald-300">
          Meta anual salva com sucesso.
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {params.error}
        </p>
      ) : null}

      {/* KPIs do ano selecionado */}
      <section aria-label={`Números de ${year}`} className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ano selecionado</p>
          <p className="mt-3 text-3xl font-semibold text-white">{year}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Meta anual atual</p>
          <p className="mt-3 text-3xl font-semibold text-white">{annualGoal}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Livros concluídos</p>
          <p className="mt-3 text-3xl font-semibold text-white">{completed}</p>
        </div>
      </section>

      {/* Progresso */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Progresso da meta</span>
          <span className="font-semibold text-white">{progressPct}%</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-[var(--bc-red)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {completed} de {annualGoal} livros em {year}.
        </p>
      </div>

      {/* Form de meta anual */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
        <h2 className="text-xl font-semibold text-white">Ajustar meta anual</h2>
        <p className="mt-1 text-sm text-slate-400">
          Cria a linha do ano em <code className="text-slate-300">statistics</code> automaticamente, caso ainda
          não exista.
        </p>
        <form action={updateAnnualGoalAction} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="year" className={adminLabelClass}>
              Ano
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min={2000}
              max={2100}
              defaultValue={year}
              required
              className={`${adminInputClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="annual_goal" className={adminLabelClass}>
              Meta anual (livros)
            </label>
            <input
              id="annual_goal"
              name="annual_goal"
              type="number"
              min={1}
              max={1000}
              defaultValue={annualGoal}
              required
              className={`${adminInputClass} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Salvar meta anual
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
