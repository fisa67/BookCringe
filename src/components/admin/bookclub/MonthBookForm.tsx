import Link from "next/link";
import type { CmsBookRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface MonthBookFormProps {
  action: (formData: FormData) => void | Promise<void>;
  books: CmsBookRecord[];
  cancelHref: string;
  errorMessage?: string;
}

/**
 * Adiciona um livro já cadastrado (módulo Biblioteca) a um mês do clube.
 * `books` vem de `bookService.getBooks()` — leitura para popular o seletor,
 * não é escrita nem duplica a lógica do módulo Biblioteca.
 */
export function MonthBookForm({ action, books, cancelHref, errorMessage }: MonthBookFormProps) {
  return (
    <form action={action} className="space-y-6">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}

      {books.length === 0 ? (
        <p className="text-sm text-slate-400">
          Nenhum livro cadastrado ainda. Cadastre um livro na{" "}
          <Link href="/admin/books" className="underline hover:text-slate-200">
            Biblioteca
          </Link>{" "}
          antes de adicioná-lo a um mês.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="book_id" className={adminLabelClass}>
              Livro *
            </label>
            <select id="book_id" name="book_id" required className={adminInputClass}>
              <option value="">Selecione um livro...</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} — {book.author}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="position" className={adminLabelClass}>
              Posição
            </label>
            <input
              id="position"
              name="position"
              type="number"
              min={0}
              placeholder="Deixe em branco para adicionar ao final"
              className={adminInputClass}
            />
            <p className="text-xs text-slate-500">
              A menor posição é exibida como livro destaque do mês.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        {books.length > 0 ? (
          <button
            type="submit"
            className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            Adicionar livro
          </button>
        ) : null}
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
