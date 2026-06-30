import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getFeaturedBook } from "@/lib/bookclub";
import { bookclub2026 } from "@/data/bookclub2026";
import { featuredBook } from "@/data/featuredBook";
import { BookCover } from "@/components/book/BookCover";
import { BookCTA } from "@/components/book/BookCTA";

export function ClubCTA() {
  const book = getFeaturedBook({ override: featuredBook, books: bookclub2026 });

  return (
    <section className="py-20 px-6 bg-[var(--bc-ink)]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* ── Left: club pitch */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-3">
            Clube de Leitura
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            Leia junto com a gente.
          </h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-md">
            Encontros mensais para discutir livros, trocar perspectivas e descobrir
            novas leituras. Gratuito, online e sem julgamento.
          </p>
          <Link href="/clube-de-leitura">
            <Button variant="primary" size="lg">
              Participar do clube
            </Button>
          </Link>
        </div>

        {/* ── Right: featured book (dynamic) */}
        {book && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-5">
              Lendo agora
            </p>

            <div className="flex gap-5 items-start">
              {/* Cover */}
              <div className="w-20 shrink-0">
                <div className="aspect-[3/4] rounded-md overflow-hidden">
                  <BookCover
                    title={book.title}
                    cover={book.cover}
                    amazonUrl={book.amazonUrl}
                    width={80}
                    height={112}
                    className="aspect-[3/4]"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-white/50 text-sm mt-0.5">{book.author}</p>
                </div>

                {/* CTA: Amazon + club page */}
                <BookCTA
                  amazonUrl={book.amazonUrl}
                  clubHref="/clube-de-leitura"
                  clubLabel="Ver no clube"
                  size="sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
