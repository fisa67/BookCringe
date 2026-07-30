"use client";

import { useState } from "react";
import Link from "next/link";
import type { CmsBookRecord, CmsContentRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import { CONTENT_ASSOCIATION_TYPES, GENERAL_CONTENT_CATEGORIES } from "@/lib/validations/content";
import { CONTENT_CATEGORY_LABELS } from "@/lib/admin/contentLabels";

type AssociationType = (typeof CONTENT_ASSOCIATION_TYPES)[number];

interface ContentAssociationFieldsProps {
  books: CmsBookRecord[];
  content?: CmsContentRecord;
}

/**
 * Ilha client do `ContentForm` (mesmo padrão de `ContentsExplorer`/
 * `AdminNav`): alterna entre "Conteúdo sobre um livro" (exige `book_id`,
 * `content_category` fixo em `"book"`) e "Conteúdo geral" (sem livro,
 * `content_category` livre) — ver `contentFormSchema`
 * (`src/lib/validations/content.ts`) para a validação correspondente.
 *
 * Sem livros cadastrados, força "Conteúdo geral": antes desta mudança o
 * módulo Conteúdo exigia sempre um livro, então cadastrar sem nenhum livro
 * ainda na Biblioteca não fazia sentido; agora isso deixou de ser verdade.
 */
export function ContentAssociationFields({ books, content }: ContentAssociationFieldsProps) {
  const hasBooks = books.length > 0;
  const initialAssociationType: AssociationType = content ? (content.book_id ? "book" : "general") : "book";
  const [associationType, setAssociationType] = useState<AssociationType>(
    hasBooks ? initialAssociationType : "general"
  );

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="space-y-2">
        <span className={adminLabelClass}>Tipo de associação *</span>
        <div className="flex flex-wrap gap-4">
          <label
            className={`flex items-center gap-2 text-sm ${hasBooks ? "text-slate-300" : "text-slate-600"}`}
          >
            <input
              type="radio"
              name="association_type"
              value="book"
              checked={associationType === "book"}
              disabled={!hasBooks}
              onChange={() => setAssociationType("book")}
              className="h-4 w-4 border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500 disabled:opacity-50"
            />
            Conteúdo sobre um livro
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="radio"
              name="association_type"
              value="general"
              checked={associationType === "general"}
              onChange={() => setAssociationType("general")}
              className="h-4 w-4 border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
            />
            Conteúdo geral
          </label>
        </div>
        {!hasBooks ? (
          <p className="text-xs text-slate-500">
            Nenhum livro cadastrado ainda — você pode criar conteúdo geral, ou{" "}
            <Link href="/admin/books" className="underline hover:text-slate-300">
              cadastrar um livro
            </Link>{" "}
            para vincular conteúdo a ele.
          </p>
        ) : null}
      </div>

      {associationType === "book" ? (
        <div className="space-y-2">
          <input type="hidden" name="content_category" value="book" />

          <label htmlFor="book_id" className={adminLabelClass}>
            Livro *
          </label>
          <select
            id="book_id"
            name="book_id"
            required
            defaultValue={content?.book_id ?? ""}
            className={adminInputClass}
          >
            <option value="">Selecione um livro...</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — {book.author}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="content_category" className={adminLabelClass}>
            Categoria *
          </label>
          <select
            id="content_category"
            name="content_category"
            required
            defaultValue={
              content?.content_category && content.content_category !== "book" ? content.content_category : ""
            }
            className={adminInputClass}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {GENERAL_CONTENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CONTENT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Conteúdo geral não fica vinculado a nenhum livro.</p>
        </div>
      )}
    </div>
  );
}
