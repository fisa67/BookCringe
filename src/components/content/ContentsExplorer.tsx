"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ContentCard } from "@/components/content/ContentCard";
import { CONTENT_FILTERS, type ContentFilterKey } from "@/lib/content";
import type { PublicContentWithBook } from "@/lib/adapters/contentPublicAdapter";

interface ContentsExplorerProps {
  contents: PublicContentWithBook[];
  books: Array<{ id: string; title: string; author: string }>;
}

/**
 * Filtro client-side de `/conteudos` — mesmo padrão de `LibraryShelf`
 * (filtro em memória com `useState`, sem navegação/query params). Recebe
 * todos os conteúdos publicados já carregados no servidor.
 */
export function ContentsExplorer({ contents, books }: ContentsExplorerProps) {
  const [filter, setFilter] = useState<ContentFilterKey>("all");
  const [bookId, setBookId] = useState<string>("");

  const filtered = useMemo(() => {
    const activeFilter = CONTENT_FILTERS.find((item) => item.key === filter);
    return contents
      .filter((content) => !activeFilter?.types || activeFilter.types.includes(content.content_type))
      .filter((content) => !bookId || content.book_id === bookId);
  }, [contents, filter, bookId]);

  return (
    <>
      <section className="py-6 px-6 border-b border-[var(--bc-border)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[var(--bc-muted)] mr-1 font-medium">Filtrar:</span>
            {CONTENT_FILTERS.map((item) => (
              <Badge
                key={item.key}
                variant={filter === item.key ? "red" : "muted"}
                className="cursor-pointer hover:border-[var(--bc-ink)] transition-colors"
                role="button"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </Badge>
            ))}
          </div>

          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full sm:w-auto sm:ml-auto h-8 rounded-full border border-[var(--bc-border)] bg-white px-3 text-xs text-[var(--bc-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bc-red)]/30"
          >
            <option value="">Todos os livros</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — {book.author}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-[var(--bc-muted)] mb-8">
            {filtered.length} conteúdo{filtered.length === 1 ? "" : "s"} encontrado
            {filtered.length === 1 ? "" : "s"}
          </p>

          {filtered.length === 0 ? (
            <div className="py-12 rounded-xl border border-dashed border-[var(--bc-border)] flex flex-col items-center gap-3 text-center">
              <span className="text-3xl">🎥</span>
              <p className="font-bold text-[var(--bc-ink)]">Nenhum conteúdo encontrado</p>
              <p className="text-sm text-[var(--bc-muted)] max-w-sm">
                Tente outro filtro ou remova o filtro por livro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {filtered.map((content) => (
                <ContentCard key={content.id} content={content} showBook />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
