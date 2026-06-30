import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { mockRecentBooks } from "@/data/mock/stats";
import type { DetailedBook } from "@/lib/types";
import { BookCard as GlobalBookCard } from "@/components/book/BookCard";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Todos os livros lidos pelo BookCringe — com notas, resenhas e dados. Filtrados por gênero, autor e país.",
};

const allGenres = Array.from(
  new Set(mockRecentBooks.flatMap((b) => b.genre ?? []))
).sort();

function LibraryBookCard({ book }: { book: DetailedBook }) {
  return (
    <GlobalBookCard book={book} clubHref="/biblioteca" clubLabel="Ver detalhes">
      {typeof book.rating === "number" && (
        <div className="flex items-center gap-1" role="img" aria-label={`${book.rating} de 5 estrelas`}>
          <span className="text-[var(--bc-red)] text-sm" aria-hidden="true">
            {"★".repeat(book.rating)}
          </span>
          <span className="text-[var(--bc-border)] text-sm" aria-hidden="true">
            {"★".repeat(5 - book.rating)}
          </span>
        </div>
      )}
      {book.country && (
        <p className="text-xs text-[var(--bc-muted)]">{book.country}</p>
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
    </GlobalBookCard>
  );
}

export default function BibliotecaPage() {
  return (
    <>
      <PageHero
        eyebrow="Biblioteca"
        title="Todos os livros lidos."
        description="Uma coleção de leituras com notas, resenhas e reflexões. Em construção contínua."
      />

      <section className="py-6 px-6 border-b border-[var(--bc-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[var(--bc-muted)] mr-2 font-medium">Filtrar:</span>
            <Badge variant="red">Todos</Badge>
            {allGenres.map((genre) => (
              <Badge key={genre} variant="muted" className="cursor-pointer hover:border-[var(--bc-ink)] transition-colors">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-[var(--bc-muted)] mb-8">
            {mockRecentBooks.length} livros encontrados
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger">
            {mockRecentBooks.map((book) => (
              <LibraryBookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Coming soon notice */}
          <div className="mt-16 py-12 rounded-xl border border-dashed border-[var(--bc-border)] flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">📚</span>
            <p className="font-bold text-[var(--bc-ink)]">Mais livros em breve</p>
            <p className="text-sm text-[var(--bc-muted)] max-w-sm">
              A biblioteca completa será populada automaticamente com dados do Bookly.
              Por ora, apenas uma amostra.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
