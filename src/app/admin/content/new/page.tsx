import type { Metadata } from "next";
import { getBooks } from "@/lib/services/bookService";
import type { CmsContentPlatform, CmsContentType } from "@/lib/types/cms";
import { CONTENT_PLATFORMS, CONTENT_TYPES } from "@/lib/validations/content";
import { ContentForm } from "@/components/admin/content/ContentForm";
import { createContentAction } from "@/app/admin/content/actions";

export const metadata: Metadata = {
  title: "Novo conteúdo — Admin BookCringe",
};

interface NewContentPageProps {
  searchParams: Promise<{ error?: string; bookId?: string; platform?: string; type?: string }>;
}

/**
 * `bookId`/`platform`/`type` na querystring vêm dos atalhos de "Ações
 * rápidas" e "Criar conteúdo" (seção Participações) em
 * `/admin/books/[id]/edit` — pré-selecionam o livro e os campos mais
 * previsíveis de cada atalho, sem exigir que o admin preencha tudo de novo.
 */
export default async function NewContentPage({ searchParams }: NewContentPageProps) {
  const { error, bookId, platform, type } = await searchParams;
  const books = await getBooks();

  const defaultPlatform = CONTENT_PLATFORMS.find((value) => value === platform) as
    | CmsContentPlatform
    | undefined;
  const defaultContentType = CONTENT_TYPES.find((value) => value === type) as CmsContentType | undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Conteúdo</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Novo conteúdo</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <ContentForm
          action={createContentAction}
          books={books ?? []}
          cancelHref="/admin/content"
          submitLabel="Criar conteúdo"
          errorMessage={error}
          defaultBookId={bookId}
          defaultPlatform={defaultPlatform}
          defaultContentType={defaultContentType}
        />
      </div>
    </div>
  );
}
