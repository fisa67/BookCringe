import Link from "next/link";
import type { Metadata } from "next";
import { getContents, type GetContentsSort } from "@/lib/services/contentService";
import { getBooks } from "@/lib/services/bookService";
import type { CmsContentCategory, CmsContentPlatform, CmsContentType } from "@/lib/types/cms";
import {
  CONTENT_CATEGORY_LABELS,
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  getContentStatus,
  type ContentStatus,
} from "@/lib/admin/contentLabels";
import { CONTENT_CATEGORIES, CONTENT_PLATFORMS, CONTENT_TYPES } from "@/lib/validations/content";
import { adminInputClass } from "@/components/admin/formStyles";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteContentAction } from "@/app/admin/content/actions";

export const metadata: Metadata = {
  title: "Conteúdo — Admin BookCringe",
};

const SORT_LABELS: Record<GetContentsSort, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigos",
  featured: "Destaques primeiro",
};

const STATUS_BADGE_CLASS: Record<ContentStatus, string> = {
  draft: "border-slate-700 bg-slate-800/60 text-slate-300",
  scheduled: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  published: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
};

interface AdminContentPageProps {
  searchParams: Promise<{
    book?: string;
    bookId?: string;
    link?: string;
    platform?: string;
    type?: string;
    category?: string;
    status?: string;
    sort?: string;
  }>;
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("pt-BR");
}

export default async function AdminContentPage({ searchParams }: AdminContentPageProps) {
  const params = await searchParams;
  const bookSearch = params.book?.trim();
  const bookId = params.bookId?.trim();
  const linkSearch = params.link?.trim();
  const platform = CONTENT_PLATFORMS.find((value) => value === params.platform) as
    | CmsContentPlatform
    | undefined;
  const contentType = CONTENT_TYPES.find((value) => value === params.type) as CmsContentType | undefined;
  const contentCategory = CONTENT_CATEGORIES.find((value) => value === params.category) as
    | CmsContentCategory
    | undefined;
  const status = (["draft", "scheduled", "published"] as const).find((value) => value === params.status);
  const sort = (["recent", "oldest", "featured"] as const).find((value) => value === params.sort) ?? "recent";

  const hasFilters = Boolean(
    bookSearch || bookId || linkSearch || platform || contentType || contentCategory || status
  );

  const books = await getBooks();
  const booksById = new Map((books ?? []).map((book) => [book.id, book]));
  const bookOptions = [...(books ?? [])].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  // Filtro exato por livro (`bookId`, via select) tem prioridade sobre a
  // busca livre por título/autor (`book`, via texto) — os dois convivem na
  // UI, mas não faz sentido combinar as duas condições na mesma query.
  let bookIds: string[] | undefined;
  if (!bookId && bookSearch) {
    const needle = bookSearch.toLowerCase();
    bookIds = (books ?? [])
      .filter(
        (book) => book.title.toLowerCase().includes(needle) || book.author.toLowerCase().includes(needle)
      )
      .map((book) => book.id);
  }

  const skipQuery = !bookId && bookSearch !== undefined && bookSearch !== "" && bookIds?.length === 0;
  const contents = skipQuery
    ? []
    : await getContents({
        bookId: bookId || undefined,
        bookIds,
        platform,
        contentType,
        contentCategory,
        search: linkSearch,
        sort,
      });

  const visibleContents =
    contents && status ? contents.filter((content) => getContentStatus(content.published_at) === status) : contents;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Conteúdo</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Gerenciar conteúdo</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Liste, busque, filtre, crie, edite e remova conteúdos editoriais (reels, vídeos, posts) vinculados
              aos livros.
            </p>
          </div>
          <Link
            href="/admin/content/new"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Novo Conteúdo
          </Link>
        </div>

        <form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" action="/admin/content">
          <select name="bookId" defaultValue={bookId ?? ""} className={adminInputClass}>
            <option value="">Filtrar por livro (exato)...</option>
            {bookOptions.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — {book.author}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="book"
            defaultValue={bookSearch}
            placeholder="...ou buscar por título/autor"
            className={adminInputClass}
          />
          <input
            type="text"
            name="link"
            defaultValue={linkSearch}
            placeholder="Buscar por link..."
            className={adminInputClass}
          />
          <select name="platform" defaultValue={platform ?? ""} className={adminInputClass}>
            <option value="">Todas as plataformas</option>
            {CONTENT_PLATFORMS.map((value) => (
              <option key={value} value={value}>
                {PLATFORM_LABELS[value]}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={contentType ?? ""} className={adminInputClass}>
            <option value="">Todos os tipos</option>
            {CONTENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={contentCategory ?? ""} className={adminInputClass}>
            <option value="">Todas as categorias</option>
            {CONTENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CONTENT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ""} className={adminInputClass}>
            <option value="">Todos os status</option>
            {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className={adminInputClass}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Filtrar
            </button>
            {hasFilters ? (
              <Link
                href="/admin/content"
                className="flex items-center rounded-md border border-slate-800 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200"
              >
                Limpar
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {visibleContents === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os conteúdos. Tente novamente em alguns instantes.
        </p>
      ) : visibleContents.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          {hasFilters
            ? "Nenhum conteúdo encontrado para os filtros informados."
            : "Nenhum conteúdo cadastrado ainda."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleContents.map((content) => {
            const book = content.book_id ? booksById.get(content.book_id) : undefined;
            const isGeneral = content.content_category !== "book";
            const contentStatus = getContentStatus(content.published_at);
            const publishedLabel = formatDate(content.published_at);

            return (
              <li
                key={content.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                      {PLATFORM_LABELS[content.platform]}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                      {CONTENT_TYPE_LABELS[content.content_type]}
                    </span>
                    {isGeneral ? (
                      <span className="rounded-full border border-sky-900/60 bg-sky-950/40 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                        {CONTENT_CATEGORY_LABELS[content.content_category]}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[contentStatus]}`}
                    >
                      {CONTENT_STATUS_LABELS[contentStatus]}
                    </span>
                    {content.is_featured ? (
                      <span className="rounded-full border border-amber-900/60 bg-amber-950/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                        Destaque
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 truncate text-base font-semibold text-white">
                    {content.title ? `${content.title} — ` : ""}
                    {isGeneral
                      ? content.title
                        ? "Conteúdo geral"
                        : "Conteúdo geral (sem título)"
                      : book
                        ? `${book.title} (${book.author})`
                        : "Livro não encontrado"}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-xs truncate underline hover:text-slate-200"
                      title={content.url}
                    >
                      {content.url}
                    </a>
                    {publishedLabel ? <span>Publicado em {publishedLabel}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/content/${content.id}/edit`}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                  >
                    Editar
                  </Link>
                  <ConfirmSubmitButton
                    action={deleteContentAction.bind(null, content.id)}
                    confirmMessage={`Remover este conteúdo (${PLATFORM_LABELS[content.platform]})? Essa ação não pode ser desfeita.`}
                    label="Excluir"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
