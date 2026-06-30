// ─────────────────────────────────────────────
// Core book types
// ─────────────────────────────────────────────

/**
 * Base type used everywhere a book is referenced across the site.
 * Extend with DetailedBook when you need richer metadata (library, blog, reviews).
 */
export type Book = {
  title: string;
  author: string;
  /** Absolute URL or path under /public (e.g. "/covers/kafka.jpg") */
  cover?: string;
  /** Amazon affiliate link — renders the "Comprar na Amazon" button when present */
  amazonUrl?: string;
  status?: "reading" | "finished" | "future" | "comingSoon";
};

/**
 * Extended book record — used in the library, blog and detailed pages.
 * Inherits all base Book fields.
 */
export interface DetailedBook extends Book {
  id: string;
  /** 1–5 stars */
  rating?: number;
  pages?: number;
  year?: number;
  genre?: string[];
  country?: string;
  /** ISO date string */
  readAt?: string;
  review?: string;
}

// ─────────────────────────────────────────────
// Reading statistics
// ─────────────────────────────────────────────

export interface ReadingStats {
  booksRead: number;
  pagesRead: number;
  hoursRead: number;
  avgRating: number;
  authorsRead: number;
  countriesRead: number;
  genresRead: number;
  annualGoal: number;
  annualProgress: number;
}

// ─────────────────────────────────────────────
// Kept for backwards-compat — will be removed when
// ClubSessions migrate fully to bookclub2026.ts data
// ─────────────────────────────────────────────

export interface ClubSession {
  id: string;
  book: Pick<Book, "title" | "author" | "cover">;
  date: string;
  theme?: string;
  description?: string;
  isUpcoming: boolean;
}

// ─────────────────────────────────────────────
// Navigation & contact
// ─────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  spotify?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PartnershipForm extends ContactForm {
  company?: string;
  type: "editora" | "autor" | "marca" | "outro";
}
