import Link from "next/link";
import type { DetailedBook } from "@/lib/types";
import { BookCover } from "@/components/book/BookCover";
import { Rating } from "@/components/bookclub/Rating";
import { Button } from "@/components/ui/Button";
import { formatRating } from "@/lib/utils";

interface MonthlyRecommendationProps {
  book: DetailedBook;
}

/**
 * Destaque "Recomendação do mês" — hero editorial acima da grade em
 * `/recomendacoes`. Alimentado por `getPublicRecommendationOfMonth`
 * (no máximo 1 livro no site inteiro, ver `is_recommendation_of_month`).
 * Sem link externo: a capa e o botão "Ver livro" sempre apontam para
 * `/livro/[slug]` (nunca a Amazon) — aqui o objetivo é a leitura editorial,
 * não a conversão de afiliado.
 */
export function MonthlyRecommendation({ book }: MonthlyRecommendationProps) {
  if (!book.slug) return null;

  return (
    <section className="rounded-2xl border border-[var(--bc-border)] bg-white p-6 sm:p-8 mb-10">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        <div className="w-full max-w-[160px] mx-auto sm:mx-0 shrink-0">
          <BookCover title={book.title} cover={book.cover} href={`/livro/${book.slug}`} width={160} height={224} />
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-[var(--bc-red)] text-white text-xs font-bold uppercase tracking-widest">
            📌 Recomendação do mês
          </span>

          <div>
            <h2 className="text-2xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight">
              <Link href={`/livro/${book.slug}`} className="hover:text-[var(--bc-red)] transition-colors">
                {book.title}
              </Link>
            </h2>
            <p className="text-[var(--bc-muted)]">{book.author}</p>
          </div>

          {typeof book.rating === "number" && (
            <div className="flex items-center gap-2">
              <Rating value={book.rating} size="sm" />
              <span className="text-sm font-semibold text-[var(--bc-ink)]">
                {formatRating(book.rating)}
              </span>
            </div>
          )}

          {book.recommendationReason && (
            <p className="text-[var(--bc-ink)] leading-relaxed line-clamp-3 max-w-2xl">
              {book.recommendationReason}
            </p>
          )}

          <div className="pt-1">
            <Link href={`/livro/${book.slug}`}>
              <Button size="md">Ver livro</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
