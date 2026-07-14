import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { getPublicReadingStatsDetailed } from "@/lib/adapters/readingStatsPublicAdapter";
import { formatNumber, formatRating } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Estatísticas",
  description:
    "Dashboard completo de leitura — livros, páginas, horas, países, gêneros e metas. Dados do Bookly.",
};

// Estatísticas lê dados do Supabase via getPublicReadingStatsDetailed —
// mesma estratégia de revalidate de src/app/page.tsx e
// src/app/clube-de-leitura/page.tsx.
export const revalidate = 3600;

export default async function EstatisticasPage() {
  const year = new Date().getFullYear();
  const { stats, genreBreakdown, countryBreakdown, monthlyBreakdown } =
    await getPublicReadingStatsDetailed(year);

  const goalPercent = Math.round((stats.annualProgress / stats.annualGoal) * 100);

  // computeMonthlyBreakdown sempre devolve 12 posições, mas genre/country
  // breakdown podem vir vazios (ex.: livros sem gênero/país cadastrado) —
  // diferente dos arrays mock fixos que substituem, que nunca eram vazios.
  // O `|| 1`/`?? 1` evita NaN/Infinity nas barras nesse cenário de borda.
  const maxMonthly = Math.max(1, ...monthlyBreakdown.map((d) => d.books));
  const topGenreCount = genreBreakdown[0]?.count ?? 1;
  const topCountryCount = countryBreakdown[0]?.count ?? 1;

  return (
    <>
      <PageHero
        eyebrow="Estatísticas"
        title="Leitura em números."
        description="Dashboard completo alimentado pelo aplicativo Bookly. Tudo que foi lido, registrado e analisado."
      />

      {/* Main KPIs */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Livros lidos", value: formatNumber(stats.booksRead), unit: "livros" },
              { label: "Páginas", value: formatNumber(stats.pagesRead), unit: "páginas" },
              { label: "Horas de leitura", value: formatNumber(stats.hoursRead), unit: "horas" },
              { label: "Nota média", value: formatRating(stats.avgRating), unit: "de 5" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-[var(--bc-border)] bg-white p-5"
              >
                <p className="text-xs text-[var(--bc-muted)] uppercase tracking-wide font-medium mb-1">
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold text-[var(--bc-ink)] tracking-tight leading-none">
                  {kpi.value}
                </p>
                <p className="text-xs text-[var(--bc-muted)] mt-1">{kpi.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual goal */}
      <section className="py-8 px-6 bg-[var(--bc-surface)]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-[var(--bc-border)] bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--bc-muted)] uppercase tracking-wide font-medium mb-1">
                  Meta anual {year}
                </p>
                <p className="text-2xl font-bold text-[var(--bc-ink)]">
                  {stats.annualProgress} de {stats.annualGoal} livros
                </p>
              </div>
              <p className="text-4xl font-bold text-[var(--bc-red)]">{goalPercent}%</p>
            </div>
            <div className="h-3 rounded-full bg-[var(--bc-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--bc-red)] transition-all duration-700"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
            <p className="text-xs text-[var(--bc-muted)] mt-2">
              Faltam {stats.annualGoal - stats.annualProgress} livros para bater a meta
            </p>
          </div>
        </div>
      </section>

      {/* Monthly chart */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6">
            Livros por mês — {year}
          </p>
          <div className="rounded-xl border border-[var(--bc-border)] bg-white p-6">
            <div className="flex items-end gap-2 h-36">
              {monthlyBreakdown.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-[var(--bc-muted)] font-medium">{d.books}</span>
                  <div
                    className="w-full rounded-t bg-[var(--bc-red)] transition-all duration-500 min-h-[4px]"
                    style={{ height: `${(d.books / maxMonthly) * 100}px` }}
                  />
                  <span className="text-[10px] text-[var(--bc-muted)]">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Genre + Country */}
      <section className="py-8 px-6 bg-[var(--bc-surface)]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Genres */}
          <div className="rounded-xl border border-[var(--bc-border)] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-4">
              Por gênero
            </p>
            <div className="flex flex-col gap-3">
              {genreBreakdown.map((g) => (
                <div key={g.genre}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--bc-ink)]">{g.genre}</span>
                    <span className="text-sm text-[var(--bc-muted)]">{g.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bc-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--bc-ink)]"
                      style={{
                        width: `${(g.count / topGenreCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div className="rounded-xl border border-[var(--bc-border)] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-4">
              Por país de origem
            </p>
            <div className="flex flex-col gap-3">
              {countryBreakdown.map((c) => (
                <div key={c.country}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--bc-ink)]">{c.country}</span>
                    <span className="text-sm text-[var(--bc-muted)]">{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bc-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--bc-red)]"
                      style={{
                        width: `${(c.count / topCountryCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-3">
            Em breve
          </p>
          <h2 className="text-2xl font-bold text-[var(--bc-ink)] mb-3">
            Dashboard completo integrado ao Bookly
          </h2>
          <p className="text-[var(--bc-muted)] text-sm leading-relaxed">
            Timeline de leituras, evolução por ano, autores mais lidos, média de avaliação por
            gênero e muito mais. Tudo em tempo real.
          </p>
        </div>
      </section>
    </>
  );
}
