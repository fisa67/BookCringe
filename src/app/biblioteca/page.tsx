import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { mockRecentBooks } from "@/data/mock/stats";
import type { Book } from "@/lib/types";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Todos os livros lidos pelo BookCringe — com notas, resenhas e dados. Filtrados por gênero, autor e país.",
};

const allGenres = Array.from(
  new Set(mockRecentBooks.flatMap((b) => b.genre ?? []))
).sort();

function BookCard({ book }: { book: Book }) {
  return (
    <div className="group p-5 rounded-xl border border-[var(--bc-border)] bg-white hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3">
      <div className="w-full h-40 rounded-lg bg-[var(--bc-surface)] flex items-center justify-center shrink-0">
        <span className="text-4xl select-none">📖</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <h3 className="font-bold text-[var(--bc-ink)] text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-[var(--bc-muted)]">{book.author}</p>
        {book.country && (
          <p className="text-xs text-[var(--bc-muted)]">{book.country}</p>
        )}
        {typeof book.rating === "number" && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[var(--bc-red)] text-sm">{"★".repeat(book.rating)}</span>
            <span className="text-[var(--bc-border)] text-sm">{"★".repeat(5 - book.rating)}</span>
          </div>
        )}
      </div>
      {book.genre && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {book.genre.slice(0, 2).map((g) => (
            <Badge key={g} variant="muted">
              {g}
            </Badge>
          ))}
        </div>
      )}
    </div>
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
              <BookCard key={book.id} book={book} />
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
