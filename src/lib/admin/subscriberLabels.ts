import type { NewsletterSource } from "@/lib/types/cms";

/**
 * Labels PT-BR de `source` — origem da inscrição no "Clube dos Leitores
 * BookCringe", usadas em `/admin/subscribers` e na exportação CSV.
 */
export const NEWSLETTER_SOURCE_LABELS: Record<NewsletterSource, string> = {
  home: "Home",
  recommendations: "Recomendações",
  book: "Página do livro",
  contents: "Conteúdos",
};
