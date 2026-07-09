"use client";

import { useMemo, useState } from "react";
import type { DetailedBook } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { BookCard as GlobalBookCard } from "@/components/book/BookCard";

interface LibraryShelfProps {
  books: DetailedBook[];
}

export function LibraryShelf({ books }: LibraryShelfProps) {
  const genres = useMemo(
    () => Array.from(new Set(books.flatMap((book) => book.genre ?? []))).sort(),
    [books]
  );

  const [selectedGenre, setSelectedGenre] = useState("Todos");

  const filteredBooks = useMemo(() => {
    if (selectedGenre === "Todos") return books;
    return books.filter((book) => book.genre?.includes(selectedGenre));
  }, [books, selectedGenre]);

  return (
    <>
      <section className="py-6 px-6 border-b border-[var(--bc-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[var(--bc-muted)] mr-2 font-medium">Filtrar:</span>
            <Badge
              variant={selectedGenre === "Todos" ? "red" : "muted"}
              className="cursor-pointer hover:border-[var(--bc-ink)] transition-colors"
              role="button"
              aria-pressed={selectedGenre === "Todos"}
              onClick={() => setSelectedGenre("Todos")}
            >
              Todos
            </Badge>
            {genres.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenre === genre ? "red" : "muted"}
                className="cursor-pointer hover:border-[var(--bc-ink)] transition-colors"
                role="button"
                aria-pressed={selectedGenre === genre}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-[var(--bc-muted)] mb-8">
            {filteredBooks.length} livro{filteredBooks.length === 1 ? "" : "s"} encontrado{filteredBooks.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger">
            {filteredBooks.map((book) => (
              <GlobalBookCard key={book.id} book={book} />
            ))}
          </div>

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
