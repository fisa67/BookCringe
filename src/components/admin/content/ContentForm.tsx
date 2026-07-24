import Link from "next/link";
import type { CmsBookRecord, CmsContentRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import { CONTENT_PLATFORMS, CONTENT_TYPES } from "@/lib/validations/content";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/admin/contentLabels";
import { ContentAssociationFields } from "@/components/admin/content/ContentAssociationFields";

interface ContentFormProps {
  action: (formData: FormData) => void | Promise<void>;
  books: CmsBookRecord[];
  content?: CmsContentRecord;
  cancelHref: string;
  submitLabel: string;
  errorMessage?: string;
}

/**
 * Formulário de conteúdo (criar/editar), mesmo padrão de `MonthForm`/
 * `MonthBookForm`: um único componente para os dois modos, Server Action via
 * `action`. `books` vem de `bookService.getBooks()` — leitura para popular o
 * seletor, a escrita do conteúdo em si passa só por `contentService`.
 *
 * A associação livro/geral e a categoria ficam em `ContentAssociationFields`
 * (ilha client) — desde a Fase 2 do módulo Conteúdo, o formulário pode ser
 * salvo mesmo sem nenhum livro cadastrado (conteúdo geral).
 */
export function ContentForm({
  action,
  books,
  content,
  cancelHref,
  submitLabel,
  errorMessage,
}: ContentFormProps) {
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

      <div className="grid gap-4 sm:grid-cols-2">
          <ContentAssociationFields books={books} content={content} />

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="title" className={adminLabelClass}>
              Título
            </label>
            <input
              id="title"
              name="title"
              type="text"
              maxLength={200}
              placeholder='Ex.: "Reel de recomendação", "Carrossel de frases"'
              defaultValue={content?.title}
              className={adminInputClass}
            />
            <p className="text-xs text-slate-500">
              Opcional — se vazio, os cards públicos usam o título do livro.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="platform" className={adminLabelClass}>
              Plataforma *
            </label>
            <select
              id="platform"
              name="platform"
              required
              defaultValue={content?.platform ?? ""}
              className={adminInputClass}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {CONTENT_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="content_type" className={adminLabelClass}>
              Tipo de conteúdo *
            </label>
            <select
              id="content_type"
              name="content_type"
              required
              defaultValue={content?.content_type ?? ""}
              className={adminInputClass}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {CONTENT_TYPES.map((contentType) => (
                <option key={contentType} value={contentType}>
                  {CONTENT_TYPE_LABELS[contentType]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="url" className={adminLabelClass}>
              Link externo *
            </label>
            <input
              id="url"
              name="url"
              type="url"
              required
              maxLength={2000}
              placeholder="https://..."
              defaultValue={content?.url}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="published_at" className={adminLabelClass}>
              Data de publicação
            </label>
            <input
              id="published_at"
              name="published_at"
              type="date"
              defaultValue={content?.published_at?.slice(0, 10)}
              className={adminInputClass}
            />
            <p className="text-xs text-slate-500">
              Em branco fica como rascunho; data futura fica agendado.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="thumbnail_path" className={adminLabelClass}>
              Thumbnail (caminho ou URL)
            </label>
            <input
              id="thumbnail_path"
              name="thumbnail_path"
              type="text"
              maxLength={500}
              placeholder="Opcional"
              defaultValue={content?.thumbnail_path}
              className={adminInputClass}
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="is_featured"
              name="is_featured"
              type="checkbox"
              value="true"
              defaultChecked={content?.is_featured ?? false}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
            />
            <label htmlFor="is_featured" className="text-sm text-slate-300">
              Conteúdo em destaque
            </label>
          </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          {submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
