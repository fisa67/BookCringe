// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

import type { Book } from "./types";

/**
 * Alias kept for convenience when narrowing on the club-specific statuses.
 * Matches Book["status"] exactly — no divergence allowed.
 */
export type BookStatus = NonNullable<Book["status"]>;

/**
 * A club reading entry. Extends the global Book type so it automatically
 * inherits cover, amazonUrl, and status. Club-specific fields are:
 *   month     — display month label (e.g. "Janeiro")
 *   rating    — club rating 1–5 (separate from the library rating)
 *   instagram — URL to the Instagram Reel published after the session
 */
export interface BookClubEntry extends Book {
  month: string;
  /** 1–5 stars. Omit when not yet rated. */
  rating?: number;
  /** URL to the Instagram Reel. Omit when unavailable. */
  instagram?: string;
  /** status is required for club entries (override optional from Book) */
  status: BookStatus;
}

export interface RegistrationPayload {
  name: string;
  /** E-mail or WhatsApp number */
  contact: string;
  platform: "instagram" | "youtube" | "tiktok" | "all";
  readingProfile: "casual" | "frequent" | "booktuber" | "returning";
  interests: string;
  message?: string;
  monthlyMeetings: boolean;
  canNotify: boolean;
  turnstileToken?: string;
  /** Honeypot – must be empty on submit */
  _hp?: string;
}

export interface RegistrationResult {
  success: boolean;
  error?: string;
}

// ─────────────────────────────────────────────
// Status config (single source of truth for UI)
// ─────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  BookStatus,
  { label: string; emoji: string; dotClass: string; badgeBg: string; badgeText: string; badgeBorder: string }
> = {
  finished: {
    label: "Concluído",
    emoji: "✅",
    dotClass: "bg-[var(--bc-ink)]",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
  },
  reading: {
    label: "Lendo agora",
    emoji: "📖",
    dotClass: "bg-[var(--bc-red)]",
    badgeBg: "bg-red-50",
    badgeText: "text-[var(--bc-red)]",
    badgeBorder: "border-[var(--bc-red)]/30",
  },
  comingSoon: {
    label: "Em breve",
    emoji: "⏳",
    dotClass: "bg-amber-400",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
  },
  future: {
    label: "Futuro",
    emoji: "🔒",
    dotClass: "bg-[var(--bc-border)]",
    badgeBg: "bg-[var(--bc-surface)]",
    badgeText: "text-[var(--bc-muted)]",
    badgeBorder: "border-[var(--bc-border)]",
  },
};

export const PLATFORM_LABELS: Record<RegistrationPayload["platform"], string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  all: "Todos",
};

export const READING_PROFILE_LABELS: Record<RegistrationPayload["readingProfile"], string> = {
  casual: "Leitor casual",
  frequent: "Leitor frequente",
  booktuber: "Booktuber / Bookstagrammer",
  returning: "Voltando a ler",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function getCurrentBook(books: BookClubEntry[]): BookClubEntry | undefined {
  return books.find((b) => b.status === "reading");
}

export function getUpcomingBook(books: BookClubEntry[]): BookClubEntry | undefined {
  return books.find((b) => b.status === "comingSoon");
}

export function getFinishedBooks(books: BookClubEntry[]): BookClubEntry[] {
  return books.filter((b) => b.status === "finished");
}

/**
 * Returns the book to feature on the Home page.
 *
 * Priority:
 *  1. `override` — set manually in src/data/featuredBook.ts
 *  2. First book with `status: "reading"` in the calendar
 *  3. First book in the list (final fallback)
 *
 * To highlight a specific book, export a non-null value from featuredBook.ts.
 * To revert to automatic selection, set it back to null.
 */
export function getFeaturedBook({
  override,
  books,
}: {
  override: Book | null;
  books: BookClubEntry[];
}): Book | undefined {
  if (override) return override;
  return getCurrentBook(books) ?? books[0];
}

/** Returns true when a contact string looks like an e-mail address. */
export function isEmail(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
}

/** Strip HTML tags and trim dangerous characters from a user-supplied string. */
export function sanitize(raw: string, maxLength = 2000): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"]/g, "")
    .trim()
    .slice(0, maxLength);
}
