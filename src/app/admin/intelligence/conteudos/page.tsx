import type { Metadata } from "next";
import Link from "next/link";
import { requireOwnerId } from "@/lib/auth/ownerId";
import { getBooks } from "@/lib/services/bookService";
import { listContents, listDatasets } from "@/lib/services/intelligenceDatasetService";
import { suggestBookMatch, type MatchableBook } from "@/lib/intelligence/matching";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";
import type { CmsBookRecord } from "@/lib/types/cms";
import type { IntelligenceContentRecord, IntelligenceDatasetRecord } from "@/lib/types/intelligence";
import { linkContentToBookAction, unlinkContentFromBookAction } from "@/app/admin/intelligence/conteudos/actions";

export const metadata: Metadata = {
  title: "Conteúdos — Intelligence — Admin BookCringe",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

function formatDate(value?: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMATTER.format(parsed);
}

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

interface IntelligenceContentsPageProps {
  searchParams: Promise<{ error?: string }>;
}

/**
 * Matching assistido entre Content (Intelligence) e Livro (CMS) —
 * `docs/content-matching.md`. Cada conteúdo importado aparece agrupado por
 * Dataset; se o título for muito parecido com um Livro cadastrado, mostra
 * "Livro sugerido" com um botão para confirmar. A confirmação (ou a escolha
 * manual, para quando não há sugestão) grava só a referência (`book_id`) —
 * nenhum dado do Livro é copiado para o Content.
 */
export default async function IntelligenceContentsPage({ searchParams }: IntelligenceContentsPageProps) {
  const { error } = await searchParams;
  const ownerId = await requireOwnerId();
  const [contents, datasets, books] = await Promise.all([
    listContents(ownerId),
    listDatasets(ownerId),
    getBooks(),
  ]);

  const datasetById = new Map((datasets ?? []).map((dataset) => [dataset.id, dataset]));
  const bookById = new Map((books ?? []).map((book) => [book.id, book]));
  const matchableBooks: MatchableBook[] = (books ?? []).map((book) => ({ id: book.id, title: book.title }));

  const contentsByDataset = new Map<string, IntelligenceContentRecord[]>();
  for (const content of contents ?? []) {
    const list = contentsByDataset.get(content.dataset_id) ?? [];
    list.push(content);
    contentsByDataset.set(content.dataset_id, list);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Conteúdos</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Conteúdos e Matching</h2>
        <p className="mt-4 max-w-2xl text-slate-300">
          Associe cada conteúdo importado a um Livro cadastrado no CMS. O matching é{" "}
          <span className="text-slate-100">assistido, nunca automático</span>: quando o título for muito
          parecido com um Livro, mostramos uma sugestão — você confirma, ou escolhe outro.
        </p>
      </section>

      {error ? (
        <p role="alert" className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {contentsByDataset.size === 0 ? (
        <EmptyState hasBooks={matchableBooks.length > 0} />
      ) : (
        Array.from(contentsByDataset.entries()).map(([datasetId, datasetContents]) => (
          <DatasetSection
            key={datasetId}
            dataset={datasetById.get(datasetId)}
            contents={datasetContents}
            bookById={bookById}
            matchableBooks={matchableBooks}
          />
        ))
      )}
    </div>
  );
}

function EmptyState({ hasBooks }: { hasBooks: boolean }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      </div>
      <p className="mt-4 font-semibold text-white">Nenhum conteúdo importado ainda</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
        Assim que uma importação for concluída em{" "}
        <Link href="/admin/intelligence/importacoes" className="text-emerald-300 hover:underline">
          Importações
        </Link>
        , os conteúdos aparecerão aqui para você associar a um Livro.
      </p>
      {!hasBooks ? (
        <p className="mx-auto mt-4 max-w-sm text-xs text-amber-300">
          Nenhum livro cadastrado no CMS ainda — cadastre em{" "}
          <Link href="/admin/books/new" className="underline">
            Biblioteca
          </Link>{" "}
          para poder vincular conteúdos.
        </p>
      ) : null}
    </section>
  );
}

function DatasetSection({
  dataset,
  contents,
  bookById,
  matchableBooks,
}: {
  dataset?: IntelligenceDatasetRecord;
  contents: IntelligenceContentRecord[];
  bookById: Map<string, CmsBookRecord>;
  matchableBooks: MatchableBook[];
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            {dataset ? platformLabel(dataset.platform) : "Dataset"}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">{dataset?.name ?? "Dataset removido"}</h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-300">
          {contents.length} conteúdo(s)
        </span>
      </div>

      <div className="space-y-4">
        {contents.map((content) => (
          <ContentRow key={content.id} content={content} bookById={bookById} matchableBooks={matchableBooks} />
        ))}
      </div>
    </section>
  );
}

function ContentRow({
  content,
  bookById,
  matchableBooks,
}: {
  content: IntelligenceContentRecord;
  bookById: Map<string, CmsBookRecord>;
  matchableBooks: MatchableBook[];
}) {
  const linkedBook = content.book_id ? bookById.get(content.book_id) : undefined;
  const suggestion = !content.book_id
    ? suggestBookMatch({ contentTitle: content.title, books: matchableBooks })
    : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{content.title}</p>
          <p className="mt-1 text-xs text-slate-500">Publicado em {formatDate(content.published_at)}</p>
        </div>

        {linkedBook ? (
          <span className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300">
            Vinculado
          </span>
        ) : suggestion ? (
          <span className="rounded-full border border-amber-800/60 bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-300">
            Livro sugerido
          </span>
        ) : (
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            Sem vínculo
          </span>
        )}
      </div>

      <div className="mt-4">
        {linkedBook ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-sm text-slate-300">
              Vinculado a <span className="font-medium text-white">{linkedBook.title}</span>
              {linkedBook.author ? <span className="text-slate-500"> — {linkedBook.author}</span> : null}
            </p>
            <form action={unlinkContentFromBookAction}>
              <input type="hidden" name="contentId" value={content.id} />
              <button type="submit" className="text-xs font-medium text-slate-400 transition hover:text-red-300">
                Desvincular
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestion ? (
              <form
                action={linkContentToBookAction}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-900/60 bg-amber-950/10 px-4 py-3"
              >
                <input type="hidden" name="contentId" value={content.id} />
                <input type="hidden" name="bookId" value={suggestion.bookId} />
                <p className="text-sm text-amber-200">
                  Livro sugerido: <span className="font-medium text-white">{suggestion.bookTitle}</span>{" "}
                  <span className="text-amber-400">({Math.round(suggestion.score * 100)}% parecido)</span>
                </p>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-700 bg-emerald-700/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-700/30"
                >
                  Confirmar
                </button>
              </form>
            ) : null}

            {matchableBooks.length > 0 ? (
              <form
                action={linkContentToBookAction}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
              >
                <input type="hidden" name="contentId" value={content.id} />
                <label className="text-xs text-slate-400" htmlFor={`book-select-${content.id}`}>
                  {suggestion ? "Ou vincular outro livro:" : "Vincular a um livro:"}
                </label>
                <select
                  id={`book-select-${content.id}`}
                  name="bookId"
                  defaultValue=""
                  required
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100"
                >
                  <option value="" disabled>
                    Selecione um livro
                  </option>
                  {matchableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  Vincular
                </button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
