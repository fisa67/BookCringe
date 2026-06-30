import Link from "next/link";
import { mockRecentBooks } from "@/data/mock/stats";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BookCard } from "@/components/book/BookCard";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= rating ? "text-[var(--bc-red)] text-sm" : "text-[var(--bc-border)] text-sm"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function RecentReads() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <SectionHeader
            eyebrow="Últimas leituras"
            title="O que andei lendo"
            className="mb-0"
          />
          <Link href="/biblioteca" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Ver biblioteca →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {mockRecentBooks.map((book, i) => (
            <div key={book.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <BookCard
                book={book}
                clubHref="/biblioteca"
                clubLabel="Ver na biblioteca"
                coverPriority={i < 2}
              >
                {/* Injected extras: rating + genre badges */}
                {typeof book.rating === "number" && (
                  <StarRating rating={book.rating} />
                )}
                {book.genre && (
                  <div className="flex flex-wrap gap-1">
                    {book.genre.slice(0, 2).map((g) => (
                      <Badge key={g} variant="muted">
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}
              </BookCard>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/biblioteca">
            <Button variant="outline" size="sm">
              Ver toda a biblioteca
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
