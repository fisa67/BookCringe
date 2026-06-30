import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BookCTAProps {
  /** Amazon affiliate URL — renders "Comprar na Amazon" when present */
  amazonUrl?: string;
  /** Internal club/page link — renders "Ver no Clube" when present */
  clubHref?: string;
  /** Label override for the club button */
  clubLabel?: string;
  size?: "sm" | "md";
  layout?: "row" | "column";
  className?: string;
}

export function BookCTA({
  amazonUrl,
  clubHref,
  clubLabel = "Ver no Clube",
  size = "sm",
  layout = "row",
  className,
}: BookCTAProps) {
  if (!amazonUrl && !clubHref) return null;

  const base = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 active:scale-[0.97]",
    size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-sm"
  );

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "column" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {amazonUrl && (
        <a
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label="Comprar na Amazon (abre em nova aba)"
          className={cn(
            base,
            "bg-[#FF9900] text-[#1A1A1A] hover:bg-[#e68a00]"
          )}
        >
          {/* Amazon "a" logomark */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")}
            aria-hidden="true"
          >
            <path d="M13.958 10.09c0 1.232.029 2.256-.59 3.346-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.29 0-2.694 2.415-3.182 4.698-3.182v.688zm3.186 7.705c-.209.189-.512.201-.745.074-1.047-.872-1.234-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.095V6.41c0-.753.06-1.642-.385-2.294-.385-.578-1.124-.816-1.775-.816-1.205 0-2.277.618-2.54 1.899-.054.285-.261.567-.549.582l-3.061-.331c-.258-.058-.545-.267-.471-.664C5.515 2.086 8.221.5 11.219.5c1.537 0 3.543.41 4.756 1.576C17.431 3.393 17.3 5.2 17.3 7.143v5.049c0 1.517.629 2.183 1.221 3.001.207.289.253.635-.01.85l-1.367 1.152zm3.649 2.953c-.516.387-1.266.416-1.861.156C17.338 19.56 15.9 17.7 14.96 16.24c-2.656 2.711-4.537 3.52-7.986 3.52-4.073 0-7.237-2.516-7.237-7.549 0-3.926 2.131-6.597 5.179-7.838C7.3 3.433 10.026 3.135 12.51 2.845v-.6c0-1.098.086-2.397-.558-3.35C11.255-1.847 9.824-2.284 8.532-2.5c-2.618-.435-6.218.696-6.218 4.093a.927.927 0 01-.619.874L-1.73 2.175c-.517-.114-1.088-.534-.941-1.329C-1.686-3.485 3.626-6 8.532-6c2.51 0 5.793.667 7.773 2.562 2.513 2.348 2.271 5.482 2.271 8.892v7.569c0 2.278.944 3.279 1.832 4.507.312.437.381 1.003-.014 1.343l-2.601 2.075z" />
          </svg>
          Comprar na Amazon
        </a>
      )}

      {clubHref && (
        <Link
          href={clubHref}
          className={cn(
            base,
            "bg-[var(--bc-surface)] text-[var(--bc-ink)] border border-[var(--bc-border)] hover:border-[var(--bc-ink)]/30 hover:bg-white"
          )}
        >
          {clubLabel}
        </Link>
      )}
    </div>
  );
}
