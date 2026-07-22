import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentById } from "@/lib/services/contentService";
import { getBooks } from "@/lib/services/bookService";
import { PLATFORM_LABELS } from "@/lib/admin/contentLabels";
import { ContentForm } from "@/components/admin/content/ContentForm";
import { updateContentAction } from "@/app/admin/content/actions";

export const metadata: Metadata = {
  title: "Editar conteúdo — Admin BookCringe",
};

interface EditContentPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditContentPage({ params, searchParams }: EditContentPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const content = await getContentById(id);

  if (!content) {
    notFound();
  }

  const books = await getBooks();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Conteúdo</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar conteúdo</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          {content.title ? `${content.title} — ` : ""}
          {PLATFORM_LABELS[content.platform]}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <ContentForm
          action={updateContentAction.bind(null, content.id)}
          books={books ?? []}
          content={content}
          cancelHref="/admin/content"
          submitLabel="Salvar alterações"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
