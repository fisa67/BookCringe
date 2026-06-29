import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { mockStats, mockRecentBooks } from "@/data/mock/stats";
import { formatNumber, formatRating } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Estatísticas",
  description:
    "Dashboard completo de leitura — livros, páginas, horas, países, gêneros e metas. Dados do Bookly.",
};

const genreData = [
  { genre: "Ficção", count: 18 },
  { genre: "Clássicos", count: 9 },
  { genre: "Romance Contemporâneo", count: 8 },
  { genre: "Fantasia", count: 5 },
  { genre: "Ficção Brasileira", count: 4 },
  { genre: "Drama", count: 3 },
];

const countryData = [
  { country: "Brasil", count: 9 },
  { country: "EUA", count: 8 },
  { country: "Reino Unido", count: 7 },
  { country: "França", count: 5 },
  { country: "Alemanha", count: 4 },
  { country: "Outros", count: 14 },
];

const monthlyData = [
  { month: "Jan", books: 4 },
  { month: "Fev", books: 3 },
  { month: "Mar", books: 5 },
  { month: "Abr", books: 4 },
  { month: "Mai", books: 6 },
  { month: "Jun", books: 3 },
  { month: "Jul", books: 4 },
  { month: "Ago", books: 5 },
  { month: "Set", books: 3 },
  { month: "Out", books: 4 },
  { month: "Nov", books: 4 },
  { month: "Dez", books: 2 },
];

const maxMonthly = Math.max(...monthlyData.map((d) => d.books));

export default function EstatisticasPage() {
  const goalPercent = Math.round(
    (mockStats.annualProgress / mockStats.annualGoal) * 100
  );

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
              { label: "Livros lidos", value: formatNumber(mockStats.booksRead), unit: "livros" },
              { label: "Páginas", value: formatNumber(mockStats.pagesRead), unit: "páginas" },
              { label: "Horas de leitura", value: formatNumber(mockStats.hoursRead), unit: "horas" },
              { label: "Nota média", value: formatRating(mockStats.avgRating), unit: "de 5" },
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
                  Meta anual 2024
                </p>
                <p className="text-2xl font-bold text-[var(--bc-ink)]">
                  {mockStats.annualProgress} de {mockStats.annualGoal} livros
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
              Faltam {mockStats.annualGoal - mockStats.annualProgress} livros para bater a meta
            </p>
          </div>
        </div>
      </section>

      {/* Monthly chart */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6">
            Livros por mês — 2024
          </p>
          <div className="rounded-xl border border-[var(--bc-border)] bg-white p-6">
            <div className="flex items-end gap-2 h-36">
              {monthlyData.map((d) => (
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
              {genreData.map((g) => (
                <div key={g.genre}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--bc-ink)]">{g.genre}</span>
                    <span className="text-sm text-[var(--bc-muted)]">{g.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bc-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--bc-ink)]"
                      style={{
                        width: `${(g.count / genreData[0].count) * 100}%`,
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
              {countryData.map((c) => (
                <div key={c.country}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--bc-ink)]">{c.country}</span>
                    <span className="text-sm text-[var(--bc-muted)]">{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bc-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--bc-red)]"
                      style={{
                        width: `${(c.count / countryData[0].count) * 100}%`,
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
