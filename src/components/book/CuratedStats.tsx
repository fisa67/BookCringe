import { formatNumber, formatRating } from "@/lib/utils";

interface CuratedStatsProps {
  booksCount: number;
  /** `undefined` quando nenhum livro da curadoria tem nota lançada. */
  avgRating?: number;
  totalContents: number;
  genresCount: number;
}

/**
 * Barra de métricas do hero de `/recomendacoes` — "estante essencial" em
 * números. Mesmo padrão visual de `StatsSection` (Home): cards
 * `bg-white rounded-xl border`, valor grande + rótulo pequeno. Todos os 4
 * números vêm de `books` (retorno de `getPublicRecommendedBooks`), já
 * filtrado pela curadoria (`favorite`/`would_recommend`) — nenhuma query
 * nova, cálculo em memória feito na própria página.
 */
export function CuratedStats({ booksCount, avgRating, totalContents, genresCount }: CuratedStatsProps) {
  const stats = [
    {
      icon: "📚",
      value: formatNumber(booksCount),
      unit: booksCount === 1 ? "livro" : "livros",
      label: "Escolhidos a dedo",
    },
    {
      icon: "★",
      value: typeof avgRating === "number" ? formatRating(avgRating) : "—",
      unit: "/ 5",
      label: "Média da curadoria",
    },
    {
      icon: "🎥",
      value: formatNumber(totalContents),
      unit: totalContents === 1 ? "conteúdo" : "conteúdos",
      label: "Conteúdos disponíveis",
    },
    {
      icon: "📖",
      value: formatNumber(genresCount),
      unit: genresCount === 1 ? "gênero" : "gêneros",
      label: "Diversidade de leituras",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="Números da curadoria">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-[var(--bc-border)] p-5 flex flex-col gap-1"
        >
          <p className="text-2xl font-bold text-[var(--bc-ink)] tracking-tight leading-none">
            {stat.icon} {stat.value}
            <span className="ml-1 text-sm font-medium text-[var(--bc-muted)]">{stat.unit}</span>
          </p>
          <p className="text-xs text-[var(--bc-muted)]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
