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
export interface BookContent {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface BookClubEntry extends Book {
  month: string;
  /** 1–5 stars. Omit when not yet rated. */
  rating?: number;
  /** Optional multi-platform content links. */
  content?: BookContent;
  /** Legacy Instagram reel URL. Retained for backward compatibility. */
  instagram?: string;
  /** Legacy reel URL interpreted as YouTube Shorts during migration. */
  reelUrl?: string;
  /** status is required for club entries (override optional from Book) */
  status: BookStatus;
}

export type BookClubMonthEntry = Omit<BookClubEntry, "status" | "month">;

export interface BookClubMonthDefinition {
  month: number;
  title?: string;
  theme?: string;
  books: BookClubMonthEntry[];
}

export interface BookClubMonth {
  monthNumber: number;
  monthLabel: string;
  title?: string;
  theme?: string;
  status: BookStatus;
  books: BookClubEntry[];
}

export interface BookClubCalendarDefinition {
  year: number;
  months: BookClubMonthDefinition[];
}

export interface BookClubCalendar {
  year: number;
  months: BookClubMonth[];
  books: BookClubEntry[];
}

export interface BookClubCurrentReading {
  calendar: BookClubCalendar;
  month: string;
  monthNumber: number;
  title?: string;
  theme?: string;
  books: BookClubEntry[];
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

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getCurrentBook(books: BookClubEntry[]): BookClubEntry | undefined {
  return books.find((b) => b.status === "reading");
}

export function getUpcomingBook(books: BookClubEntry[]): BookClubEntry | undefined {
  return books.find((b) => b.status === "comingSoon");
}

export function getFinishedBooks(books: BookClubEntry[]): BookClubEntry[] {
  return books.filter((b) => b.status === "finished");
}

export type BookContentPlatform = "instagram" | "tiktok" | "youtube";

export interface BookContentLink {
  url: string;
  platform: BookContentPlatform;
  label: string;
}

function getYouTubeLabel(url: string) {
  return url.includes("/shorts/") ? "Assistir Shorts" : "Assistir vídeo";
}

export function getBookContentLink(entry: BookClubEntry): BookContentLink | undefined {
  const content = entry.content;

  if (content?.instagram) {
    return { url: content.instagram, platform: "instagram", label: "Assistir Reel" };
  }

  if (content?.tiktok) {
    return { url: content.tiktok, platform: "tiktok", label: "Assistir Reel" };
  }

  if (content?.youtube) {
    return { url: content.youtube, platform: "youtube", label: getYouTubeLabel(content.youtube) };
  }

  if (entry.reelUrl) {
    return { url: entry.reelUrl, platform: "youtube", label: getYouTubeLabel(entry.reelUrl) };
  }

  if (entry.instagram) {
    return { url: entry.instagram, platform: "instagram", label: "Assistir Reel" };
  }

  return undefined;
}

function getMonthLabel(monthNumber: number): string {
  return MONTH_LABELS[monthNumber - 1] ?? `Mês ${monthNumber}`;
}

function getNormalizedMonthLabel(month: BookClubMonthDefinition): string {
  const label = getMonthLabel(month.month);
  if (month.title) return `${label} — ${month.title}`;
  if (month.theme) return `${label} — ${month.theme}`;
  return label;
}

export function validateBookClubCalendarDefinition(calendar: BookClubCalendarDefinition): void {
  if (!Array.isArray(calendar.months)) {
    throw new Error(`Calendário ${calendar.year} inválido. Deve conter uma lista de meses.`);
  }

  const foundNumbers = new Set<number>();
  const duplicateMonths: string[] = [];
  const invalidMonths: string[] = [];
  const emptyMonths: string[] = [];

  calendar.months.forEach((month) => {
    if (!Number.isInteger(month.month) || month.month < 1 || month.month > 12) {
      invalidMonths.push(String(month.month));
      return;
    }

    if (foundNumbers.has(month.month)) {
      duplicateMonths.push(getMonthLabel(month.month));
    } else {
      foundNumbers.add(month.month);
    }

    if (!Array.isArray(month.books) || month.books.length === 0) {
      emptyMonths.push(getMonthLabel(month.month));
    }
  });

  const missingMonths = MONTH_LABELS.filter((_, index) => !foundNumbers.has(index + 1));
  const errors: string[] = [];

  if (calendar.months.length !== 12 || missingMonths.length > 0) {
    errors.push(`O calendário deve conter 12 meses. Encontrado(s): ${calendar.months.length}.`);
  }

  if (duplicateMonths.length > 0) {
    errors.push(`Mês(es) duplicado(s): ${duplicateMonths.join(", ")}.`);
  }

  if (invalidMonths.length > 0) {
    errors.push(`Mês(es) inválido(s): ${invalidMonths.join(", ")}. Use valores de 1 a 12.`);
  }

  if (emptyMonths.length > 0) {
    errors.push(`Mês(es) sem livros: ${emptyMonths.join(", ")}.`);
  }

  if (errors.length > 0) {
    throw new Error(`Calendário ${calendar.year} inválido.\n${errors.join("\n")}`);
  }
}

function getStatusForMonth(calendarYear: number, monthNumber: number, now = new Date()): BookStatus {
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth() + 1;

  if (calendarYear < currentYear) {
    return "finished";
  }

  if (calendarYear > currentYear) {
    return "future";
  }

  if (monthNumber < currentMonthIndex) {
    return "finished";
  }

  if (monthNumber === currentMonthIndex) {
    return "reading";
  }

  return "future";
}

export function normalizeBookClubCalendar(
  calendar: BookClubCalendarDefinition,
  now = new Date()
): BookClubCalendar {
  validateBookClubCalendarDefinition(calendar);

  const sortedMonths = [...calendar.months].sort((a, b) => a.month - b.month);
  const months = sortedMonths.map((month) => ({
    monthNumber: month.month,
    monthLabel: getNormalizedMonthLabel(month),
    title: month.title,
    theme: month.theme,
    status: getStatusForMonth(calendar.year, month.month, now),
    books: month.books.map((entry) => ({
      ...entry,
      month: getNormalizedMonthLabel(month),
      status: getStatusForMonth(calendar.year, month.month, now),
    })),
  }));

  return {
    year: calendar.year,
    months,
    books: months.flatMap((month) => month.books),
  };
}

export function getCalendarByYear(
  calendars: readonly BookClubCalendarDefinition[],
  year: number,
  now = new Date()
): BookClubCalendar | undefined {
  const calendar = calendars.find((calendar) => calendar.year === year);
  return calendar ? normalizeBookClubCalendar(calendar, now) : undefined;
}

export function getCurrentCalendar(
  calendars: readonly BookClubCalendarDefinition[],
  now = new Date()
): BookClubCalendar | undefined {
  return getCalendarByYear(calendars, now.getFullYear(), now);
}

export function getCurrentReading(
  calendars: readonly BookClubCalendarDefinition[],
  now = new Date()
): BookClubCurrentReading | undefined {
  const calendar = getCurrentCalendar(calendars, now);
  if (!calendar) return undefined;

  const month = calendar.months.find((entry) => entry.status === "reading");
  if (!month) return undefined;

  return {
    calendar,
    month: month.monthLabel,
    monthNumber: month.monthNumber,
    title: month.title,
    theme: month.theme,
    books: month.books,
    status: month.status,
  };
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
