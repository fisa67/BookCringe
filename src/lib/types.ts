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
  /** Book detail page slug (`/livro/[slug]`) — when present, the cover/title link there. */
  slug?: string;
  /** Quantidade de conteúdos públicos (reels/shorts/vídeos/carrosséis/reviews) já publicados para este livro. */
  contentCount?: number;
  /** true quando há ao menos 1 conteúdo do tipo reel/short/youtube/vídeo — dispara o CTA "▶ Assistir vídeo". */
  hasVideoContent?: boolean;
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
