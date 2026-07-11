import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookById } from "@/lib/services/bookService";
import { BookForm } from "@/components/admin/books/BookForm";
import { updateBookAction } from "@/app/admin/books/actions";

export const metadata: Metadata = {
  title: "Editar livro — Admin BookCringe",
};

interface EditBookPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditBookPage({ params, searchParams }: EditBookPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Biblioteca</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar livro</h1>
        <p className="mt-4 max-w-2xl text-slate-300">{book.title}</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <BookForm
          action={updateBookAction.bind(null, book.id)}
          book={book}
          submitLabel="Salvar alterações"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
