import type { Metadata } from "next";
import { BookForm } from "@/components/admin/books/BookForm";
import { createBookAction } from "@/app/admin/books/actions";

export const metadata: Metadata = {
  title: "Novo livro — Admin BookCringe",
};

interface NewBookPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewBookPage({ searchParams }: NewBookPageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Biblioteca</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Novo livro</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <BookForm action={createBookAction} submitLabel="Criar livro" errorMessage={error} />
      </div>
    </div>
  );
}
