import { getCurrentBook, type BookClubEntry } from "@/lib/bookclub";

interface ReadingBannerProps {
  books: BookClubEntry[];
}

export function ReadingBanner({ books }: ReadingBannerProps) {
  const current = getCurrentBook(books);

  if (!current) return null;

  return (
    <section className="px-6 py-10 bg-[var(--bc-cream)] border-b border-[var(--bc-border)]">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-[var(--bc-red)]/20 bg-white overflow-hidden">
          {/* Red accent bar */}
          <div className="h-1 bg-[var(--bc-red)]" aria-hidden="true" />

          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[var(--bc-red)]/10 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="text-2xl md:text-3xl">📖</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-1">
                Estamos lendo neste mês · {current.month}
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--bc-ink)] leading-tight truncate">
                {current.title}
              </h2>
              <p className="text-sm text-[var(--bc-muted)] mt-0.5">{current.author}</p>
            </div>

            {/* Pulse indicator */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <span
                className="w-2.5 h-2.5 rounded-full bg-[var(--bc-red)] animate-pulse"
                aria-hidden="true"
              />
              <span className="text-sm text-[var(--bc-muted)]">Leitura ativa</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
