import { STATUS_CONFIG, type BookClubEntry } from "@/lib/bookclub";
import { BookCard } from "./BookCard";
import { cn } from "@/lib/utils";

interface BookTimelineProps {
  books: BookClubEntry[];
  year?: number;
}

export function BookTimeline({ books, year = 2026 }: BookTimelineProps) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-2">
            Calendário de leitura
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--bc-ink)] tracking-tight">
            {year} — todos os livros
          </h2>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4" aria-label="Legenda de status">
            {(["finished", "reading", "comingSoon", "future"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <span key={s} className="flex items-center gap-1.5 text-xs text-[var(--bc-muted)]">
                  <span
                    className={cn("w-2 h-2 rounded-full", cfg.dotClass)}
                    aria-hidden="true"
                  />
                  {cfg.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Timeline grid */}
        <div className="relative">
          {/* Vertical line (desktop left column visual) */}
          <div
            className="hidden lg:block absolute left-[2.25rem] top-3 bottom-3 w-px bg-[var(--bc-border)]"
            aria-hidden="true"
          />

          <ol className="relative space-y-4" aria-label="Lista de leituras do clube">
            {books.map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status];

              return (
                <li key={entry.month} className="relative flex items-start gap-4 lg:gap-6">
                  {/* Timeline dot (visible on large screens) */}
                  <div className="hidden lg:flex w-9 h-9 shrink-0 rounded-full border-2 border-white bg-[var(--bc-cream)] items-center justify-center z-10 mt-0.5">
                    <span
                      className={cn("w-3 h-3 rounded-full", cfg.dotClass)}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    <BookCard entry={entry} index={i} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
