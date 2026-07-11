import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBookClubMonthBooks,
  getBookClubMonthById,
  getBookClubYearById,
} from "@/lib/services/clubService";
import { getBooks } from "@/lib/services/bookService";
import { getMonthLabel } from "@/lib/admin/bookclubLabels";
import { BookCover } from "@/components/book/BookCover";
import { isDisplayableCoverPath } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  deleteBookClubMonthBookAction,
  setActiveBookClubMonthAction,
  setFeaturedBookClubMonthBookAction,
} from "@/app/admin/bookclub/actions";

export const metadata: Metadata = {
  title: "Mês do clube — Admin BookCringe",
};

interface MonthDetailPageProps {
  params: Promise<{ yearId: string; monthId: string }>;
}

export default async function MonthDetailPage({ params }: MonthDetailPageProps) {
  const { yearId, monthId } = await params;
  const year = await getBookClubYearById(yearId);
  const month = await getBookClubMonthById(monthId);

  if (!year || !month || month.year_id !== year.id) {
    notFound();
  }

  const [monthBooks, allBooks] = await Promise.all([getBookClubMonthBooks(monthId), getBooks()]);
  const bookById = new Map((allBooks ?? []).map((book) => [book.id, book]));
  const isActive = month.metadata?.is_active === true;
  const startDate = typeof month.metadata?.start_date === "string" ? month.metadata.start_date : undefined;
  const endDate = typeof month.metadata?.end_date === "string" ? month.metadata.end_date : undefined;
  const minPosition = monthBooks && monthBooks.length > 0
    ? Math.min(...monthBooks.map((entry) => entry.position))
    : undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Clube de Leitura — {year.year}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <h1 className="text-3xl font-semibold text-white">{getMonthLabel(month.month)}</h1>
              {isActive ? (
                <span className="rounded-full border border-emerald-800 bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  Mês ativo
                </span>
              ) : null}
            </div>
            {month.theme ? <p className="mt-2 text-slate-300">{month.theme}</p> : null}
            {month.notes ? <p className="mt-2 max-w-2xl text-sm text-slate-400">{month.notes}</p> : null}
            {startDate || endDate ? (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                {startDate ?? "?"} até {endDate ?? "?"}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/bookclub/${year.id}/months/${month.id}/edit`}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Editar mês
            </Link>
            {!isActive ? (
              <form action={setActiveBookClubMonthAction.bind(null, year.id, month.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-700 hover:bg-emerald-950/70 hover:text-emerald-200"
                >
                  Marcar como ativo
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/admin/bookclub/${year.id}/months/${month.id}/books/new`}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Adicionar Livro
          </Link>
        </div>
      </div>

      {monthBooks === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os livros deste mês. Tente novamente em alguns instantes.
        </p>
      ) : monthBooks.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhum livro adicionado a este mês ainda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {monthBooks.map((entry) => {
            const book = bookById.get(entry.book_id);
            const isFeatured = entry.position === minPosition;

            return (
              <li
                key={entry.id}
                className="flex gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
              >
                <div className="w-16 shrink-0">
                  <BookCover
                    title={book?.title ?? "Livro removido"}
                    cover={
                      book && isDisplayableCoverPath(book.cover_path) ? book.cover_path : undefined
                    }
                    width={64}
                    height={92}
                    className="aspect-[2/3]"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="truncate text-base font-semibold text-white"
                        title={book?.title ?? entry.book_id}
                      >
                        {book?.title ?? "Livro removido"}
                      </p>
                      {isFeatured ? (
                        <span className="shrink-0 rounded-full border border-amber-800 bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-300">
                          Destaque
                        </span>
                      ) : null}
                    </div>
                    {book ? (
                      <p className="truncate text-sm text-slate-400" title={book.author}>
                        {book.author}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">Posição: {entry.position}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!isFeatured ? (
                      <form
                        action={setFeaturedBookClubMonthBookAction.bind(
                          null,
                          year.id,
                          month.id,
                          entry.id
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-amber-900/60 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:border-amber-700 hover:bg-amber-950/70 hover:text-amber-200"
                        >
                          Tornar destaque
                        </button>
                      </form>
                    ) : null}
                    <ConfirmSubmitButton
                      action={deleteBookClubMonthBookAction.bind(null, year.id, month.id, entry.id)}
                      confirmMessage={`Remover "${book?.title ?? "este livro"}" deste mês?`}
                      label="Remover"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
