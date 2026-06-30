import { cn } from "@/lib/utils";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";
import { BookCTA } from "./BookCTA";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export interface BookCardProps {
  book: Book;
  /**
   * "vertical"  — cover on top, info below (default; for grids)
   * "horizontal" — cover on left, info on right (for list/timeline use)
   */
  variant?: "vertical" | "horizontal";
  /**
   * Injected between author and CTA.
   * Use for rating stars, genre badges, status badges, reel links, etc.
   */
  children?: React.ReactNode;
  /** Show the CTA row (Amazon + optional club button). Default: true */
  showCTA?: boolean;
  /** Internal link for "Ver no Clube" button */
  clubHref?: string;
  /** Label override for the club button */
  clubLabel?: string;
  /** Cover image priority hint for next/image (set true for above-the-fold items) */
  coverPriority?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function BookCard({
  book,
  variant = "vertical",
  children,
  showCTA = true,
  clubHref,
  clubLabel,
  coverPriority = false,
  className,
}: BookCardProps) {
  const hasCTA = showCTA && (!!book.amazonUrl || !!clubHref);

  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "group flex gap-4 rounded-xl border border-[var(--bc-border)] bg-white p-4",
          "hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200",
          className
        )}
      >
        {/* Cover — fixed narrow width */}
        <div className="w-16 shrink-0">
          <div className="aspect-[3/4] rounded-md overflow-hidden">
            <BookCover
              title={book.title}
              cover={book.cover}
              amazonUrl={book.amazonUrl}
              width={64}
              height={90}
              className="aspect-[3/4]"
              priority={coverPriority}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
          <div>
            <h3 className="font-bold text-sm text-[var(--bc-ink)] leading-tight line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-[var(--bc-muted)] mt-0.5">{book.author}</p>
          </div>

          {children && <div className="flex flex-col gap-1.5">{children}</div>}

          {hasCTA && (
            <BookCTA
              amazonUrl={book.amazonUrl}
              clubHref={clubHref}
              clubLabel={clubLabel}
              size="sm"
            />
          )}
        </div>
      </div>
    );
  }

  // ── Vertical (default)
  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl border border-[var(--bc-border)] bg-white overflow-hidden",
        "hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      {/* Cover — 3:4 aspect ratio */}
      <div className="aspect-[3/4] overflow-hidden">
        <BookCover
          title={book.title}
          cover={book.cover}
          amazonUrl={book.amazonUrl}
          width={200}
          height={280}
          className="aspect-[3/4]"
          priority={coverPriority}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <h3 className="font-bold text-sm text-[var(--bc-ink)] leading-tight line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-[var(--bc-muted)] mt-0.5 line-clamp-1">
            {book.author}
          </p>
        </div>

        {children && <div className="flex flex-col gap-1.5">{children}</div>}

        {hasCTA && (
          <div className="mt-auto pt-2">
            <BookCTA
              amazonUrl={book.amazonUrl}
              clubHref={clubHref}
              clubLabel={clubLabel}
              size="sm"
              layout="column"
            />
          </div>
        )}
      </div>
    </div>
  );
}
