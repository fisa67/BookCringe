import Image from "next/image";
import { cn } from "@/lib/utils";

// Deterministic tint based on title initial — avoids relying on random values
const TINTS = [
  "bg-slate-100",
  "bg-red-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-orange-50",
  "bg-pink-50",
] as const;

function tintFor(title: string): string {
  const code = title.charCodeAt(0) ?? 0;
  return TINTS[code % TINTS.length];
}

// ─────────────────────────────────────────────
// Fallback cover — shown when `cover` is absent
// ─────────────────────────────────────────────

function CoverFallback({ title }: { title: string }) {
  const initial = (title[0] ?? "?").toUpperCase();
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center overflow-hidden",
        tintFor(title)
      )}
      aria-hidden="true"
    >
      {/* Decorative oversized initial */}
      <span className="absolute text-[5rem] font-black text-black/5 leading-none select-none pointer-events-none">
        {initial}
      </span>
      {/* Centered icon */}
      <span className="relative text-2xl select-none">📖</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// BookCover
// ─────────────────────────────────────────────

export interface BookCoverProps {
  title: string;
  cover?: string;
  /** When present, wraps the cover in an affiliate link */
  amazonUrl?: string;
  /** Controls the rendered image size (passed to next/image) */
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function BookCover({
  title,
  cover,
  amazonUrl,
  width = 200,
  height = 280,
  className,
  priority = false,
}: BookCoverProps) {
  const imageEl = cover ? (
    <Image
      src={cover}
      alt={`Capa do livro: ${title}`}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full object-cover"
      priority={priority}
    />
  ) : (
    <CoverFallback title={title} />
  );

  const wrapper = (
    <div className={cn("relative w-full overflow-hidden rounded-lg bg-[var(--bc-surface)]", className)}>
      {imageEl}
    </div>
  );

  if (amazonUrl) {
    return (
      <a
        href={amazonUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`Ver "${title}" na Amazon`}
        className="block hover:opacity-90 transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-[var(--bc-red)] focus-visible:rounded-lg"
        tabIndex={0}
      >
        {wrapper}
      </a>
    );
  }

  return wrapper;
}
