import Link from "next/link";
import type { CmsBookRecord } from "@/lib/types/cms";
import { BookCoverField } from "@/components/admin/books/BookCoverField";
import { adminInputClass as inputClass, adminLabelClass as labelClass } from "@/components/admin/formStyles";

interface BookFormProps {
  action: (formData: FormData) => void | Promise<void>;
  book?: CmsBookRecord;
  submitLabel: string;
  errorMessage?: string;
}

/**
 * Formulário de livro (criar/editar). Server Component — a única parte
 * interativa no cliente é `BookCoverField` (preview da capa). Validação
 * primária via atributos HTML nativos (`required`, `type`, `maxLength`);
 * o Server Action valida novamente com Zod antes de persistir.
 */
export function BookForm({ action, book, submitLabel, errorMessage }: BookFormProps) {
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

      <BookCoverField title={book?.title ?? ""} defaultValue={book?.cover_path} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Título *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={book?.title}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="subtitle" className={labelClass}>
            Subtítulo
          </label>
          <input
            id="subtitle"
            name="subtitle"
            type="text"
            maxLength={200}
            defaultValue={book?.subtitle}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="author" className={labelClass}>
            Autor *
          </label>
          <input
            id="author"
            name="author"
            type="text"
            required
            maxLength={150}
            defaultValue={book?.author}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="publisher" className={labelClass}>
            Editora
          </label>
          <input
            id="publisher"
            name="publisher"
            type="text"
            maxLength={150}
            defaultValue={book?.publisher}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="publication_year" className={labelClass}>
            Ano de publicação
          </label>
          <input
            id="publication_year"
            name="publication_year"
            type="number"
            min={0}
            max={3000}
            defaultValue={book?.publication_year}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="isbn" className={labelClass}>
            ISBN
          </label>
          <input
            id="isbn"
            name="isbn"
            type="text"
            maxLength={32}
            defaultValue={book?.isbn}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="page_count" className={labelClass}>
            Número de páginas
          </label>
          <input
            id="page_count"
            name="page_count"
            type="number"
            min={0}
            max={100000}
            defaultValue={book?.page_count}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="format" className={labelClass}>
            Formato
          </label>
          <input
            id="format"
            name="format"
            type="text"
            placeholder="Físico, e-book, audiobook..."
            maxLength={50}
            defaultValue={book?.format}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="language" className={labelClass}>
            Idioma
          </label>
          <input
            id="language"
            name="language"
            type="text"
            maxLength={50}
            defaultValue={book?.language}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="country" className={labelClass}>
            País
          </label>
          <input
            id="country"
            name="country"
            type="text"
            maxLength={80}
            defaultValue={book?.country}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="genres" className={labelClass}>
            Gêneros (separados por vírgula)
          </label>
          <input
            id="genres"
            name="genres"
            type="text"
            placeholder="Romance, Ficção, Terror"
            defaultValue={book?.genres?.join(", ")}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="amazon_url" className={labelClass}>
            URL da Amazon
          </label>
          <input
            id="amazon_url"
            name="amazon_url"
            type="url"
            placeholder="https://www.amazon.com.br/..."
            defaultValue={book?.amazon_url}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="notes" className={labelClass}>
            Notas internas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={book?.notes}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/books"
          className="text-sm text-slate-400 transition hover:text-slate-200"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
