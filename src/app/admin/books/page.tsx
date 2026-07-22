import Link from "next/link";
import type { Metadata } from "next";
import { getBooks } from "@/lib/services/bookService";
import { BookCover } from "@/components/book/BookCover";
import { DeleteBookButton } from "@/components/admin/books/DeleteBookButton";
import { deleteBookAction } from "@/app/admin/books/actions";
import { isDisplayableCoverPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Biblioteca — Admin BookCringe",
};

interface AdminBooksPageProps {
  searchParams: Promise<{ title?: string; author?: string }>;
}

export default async function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  const { title, author } = await searchParams;
  const books = await getBooks({ title, author });
  const hasFilters = Boolean(title || author);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Biblioteca</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Gerenciar livros</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Liste, busque, crie, edite e remova registros de livros.
            </p>
          </div>
          <Link
            href="/admin/books/new"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Novo Livro
          </Link>
        </div>

        <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/admin/books">
          <input
            type="text"
            name="title"
            defaultValue={title}
            placeholder="Buscar por título..."
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
          />
          <input
            type="text"
            name="author"
            defaultValue={author}
            placeholder="Buscar por autor..."
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Buscar
            </button>
            {hasFilters ? (
              <Link
                href="/admin/books"
                className="flex items-center rounded-md border border-slate-800 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200"
              >
                Limpar
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {books === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os livros. Tente novamente em alguns instantes.
        </p>
      ) : books.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          {hasFilters
            ? "Nenhum livro encontrado para os filtros informados."
            : "Nenhum livro cadastrado ainda."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
            >
              <div className="w-16 shrink-0">
                <BookCover
                  title={book.title}
                  cover={isDisplayableCoverPath(book.cover_path) ? book.cover_path : undefined}
                  width={64}
                  height={92}
                  className="aspect-[2/3]"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white" title={book.title}>
                    {book.title}
                  </p>
                  <p className="truncate text-sm text-slate-400" title={book.author}>
                    {book.author}
                  </p>
                  {book.publication_year ? (
                    <p className="mt-1 text-xs text-slate-500">{book.publication_year}</p>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/admin/books/${book.id}/edit`}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/admin/content?bookId=${book.id}`}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                  >
                    Conteúdos
                  </Link>
                  <DeleteBookButton
                    action={deleteBookAction.bind(null, book.id)}
                    bookTitle={book.title}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
