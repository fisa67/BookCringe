import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type BookClubEntry } from "@/lib/bookclub";
import { StatusBadge } from "./StatusBadge";
import { Rating } from "./Rating";
import { BookCover } from "@/components/book/BookCover";
import { BookCTA } from "@/components/book/BookCTA";

interface BookCardProps {
  entry: BookClubEntry;
  index: number;
}

export function BookCard({ entry, index }: BookCardProps) {
  const isActive = entry.status === "reading";
  const isDone = entry.status === "finished";
  const isFuture = entry.status === "future" || entry.status === "comingSoon";

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all duration-200 group overflow-hidden",
        isActive
          ? "border-[var(--bc-red)]/40 bg-white ring-1 ring-[var(--bc-red)]/10"
          : isDone
          ? "border-[var(--bc-border)] bg-white hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5"
          : "border-[var(--bc-border)] bg-[var(--bc-surface)] hover:bg-white hover:-translate-y-0.5",
        "animate-fade-up"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Active reading pulse dot */}
      {isActive && (
        <div
          className="absolute top-3 right-3 z-10 w-2 h-2 rounded-full bg-[var(--bc-red)] animate-pulse"
          aria-hidden="true"
        />
      )}

      <div className="flex gap-3 p-4">
        {/* ── Cover (BookCover from global book system) */}
        <div className="w-12 shrink-0">
          <div className="aspect-[3/4] rounded-md overflow-hidden">
            <BookCover
              title={entry.title}
              cover={entry.cover}
              amazonUrl={entry.amazonUrl}
              width={48}
              height={68}
              className={cn(
                "aspect-[3/4]",
                isFuture && "opacity-50"
              )}
            />
          </div>
        </div>

        {/* ── Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Month + Status */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-widest",
                isActive ? "text-[var(--bc-red)]" : "text-[var(--bc-muted)]"
              )}
            >
              {entry.month}
            </span>
            <StatusBadge status={entry.status} size="sm" />
          </div>

          {/* Title + Author */}
          <div>
            <h3
              className={cn(
                "font-bold leading-tight",
                isActive
                  ? "text-[var(--bc-ink)] text-sm"
                  : isFuture
                  ? "text-[var(--bc-muted)] text-sm"
                  : "text-[var(--bc-ink)] text-sm"
              )}
            >
              {entry.title}
            </h3>
            <p
              className={cn(
                "text-xs mt-0.5",
                isFuture ? "text-[var(--bc-muted)]/60" : "text-[var(--bc-muted)]"
              )}
            >
              {entry.author}
            </p>
          </div>

          {/* Rating — finished only */}
          {isDone && typeof entry.rating === "number" && (
            <Rating value={entry.rating} size="sm" />
          )}

          {/* Reel link — finished with instagram, or "Em breve" label */}
          {isDone && entry.instagram ? (
            <a
              href={entry.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--bc-ink)] hover:text-[var(--bc-red)] transition-colors w-fit"
              aria-label={`Assistir Reel do livro ${entry.title}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Assistir Reel
            </a>
          ) : (
            entry.status === "comingSoon" && (
              <p className="text-xs text-amber-600/80 font-medium">Reel em breve</p>
            )
          )}

          {/* Amazon CTA — rendered by global BookCTA */}
          {entry.amazonUrl && (
            <BookCTA
              amazonUrl={entry.amazonUrl}
              size="sm"
              className="mt-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}
