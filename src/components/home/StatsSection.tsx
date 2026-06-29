import { SectionHeader } from "@/components/ui/SectionHeader";
import { mockStats } from "@/data/mock/stats";
import { formatNumber, formatRating } from "@/lib/utils";

const stats = [
  { label: "Livros lidos", value: formatNumber(mockStats.booksRead), unit: "livros" },
  { label: "Páginas lidas", value: formatNumber(mockStats.pagesRead), unit: "páginas" },
  { label: "Horas de leitura", value: formatNumber(mockStats.hoursRead), unit: "horas" },
  { label: "Nota média", value: formatRating(mockStats.avgRating), unit: "/ 5" },
  { label: "Autores", value: formatNumber(mockStats.authorsRead), unit: "autores" },
  { label: "Países", value: formatNumber(mockStats.countriesRead), unit: "países" },
  { label: "Gêneros", value: formatNumber(mockStats.genresRead), unit: "gêneros" },
  {
    label: "Meta anual",
    value: `${mockStats.annualProgress}/${mockStats.annualGoal}`,
    unit: "livros",
    isGoal: true,
    progress: Math.round((mockStats.annualProgress / mockStats.annualGoal) * 100),
  },
];

export function StatsSection() {
  return (
    <section className="py-20 px-6 bg-[var(--bc-surface)]">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Via Bookly"
          title="Leituras em números"
          description="Dados sincronizados automaticamente do aplicativo Bookly. Cada página virada, registrada."
          align="center"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-[var(--bc-border)] p-5 flex flex-col gap-1 animate-fade-up"
            >
              <p className="text-xs text-[var(--bc-muted)] font-medium uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-[var(--bc-ink)] tracking-tight leading-none mt-1">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--bc-muted)]">{stat.unit}</p>
              {"isGoal" in stat && stat.isGoal && typeof stat.progress === "number" && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-[var(--bc-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--bc-red)] transition-all duration-700"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--bc-muted)] mt-1">{stat.progress}% concluído</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[var(--bc-muted)] mt-6">
          * Dados mock. Integração com Bookly será ativada em breve.
        </p>
      </div>
    </section>
  );
}
