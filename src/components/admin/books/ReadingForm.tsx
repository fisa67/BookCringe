import type { CmsBookReadingRecord } from "@/lib/types/cms";
import { formatSecondsToHhMmSs } from "@/lib/utils/time";
import { adminInputClass as inputClass, adminLabelClass as labelClass } from "@/components/admin/formStyles";

interface ReadingFormProps {
  action: (formData: FormData) => void | Promise<void>;
  reading?: CmsBookReadingRecord | null;
  submitLabel: string;
  errorMessage?: string;
}

/**
 * Formulário de dados de leitura (nota, favorito, recomendaria, resenha,
 * tempo de leitura) — segundo card de `/admin/books/[id]/edit`, independente
 * de `BookForm`. Server Component, sem estado no cliente: `defaultValue`/
 * `defaultChecked` refletem a leitura existente (se houver) e o submit
 * nativo do `<form>` aciona a Server Action `saveReadingAction`.
 *
 * Sem `reading` (livro que ainda não foi lido), o formulário começa vazio —
 * `saveReadingAction`/`saveReading` criam a leitura na primeira gravação.
 */
export function ReadingForm({ action, reading, submitLabel, errorMessage }: ReadingFormProps) {
  const readingTimeSeconds =
    reading?.reading_time_seconds != null ? Number(reading.reading_time_seconds) : undefined;

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

      {!reading ? (
        <p className="text-sm text-slate-400">
          Este livro ainda não tem uma leitura registrada. Salvar este formulário cria a leitura.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="rating" className={labelClass}>
            Nota (0 a 5)
          </label>
          <input
            id="rating"
            name="rating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            defaultValue={reading?.rating}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reading_time" className={labelClass}>
            Tempo de leitura (H:MM:SS)
          </label>
          <input
            id="reading_time"
            name="reading_time"
            type="text"
            placeholder="0:00:00"
            defaultValue={formatSecondsToHhMmSs(readingTimeSeconds)}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="favorite"
            name="favorite"
            type="checkbox"
            value="true"
            defaultChecked={reading?.favorite ?? false}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
          />
          <label htmlFor="favorite" className="text-sm text-slate-300">
            Favorito
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="would_recommend"
            name="would_recommend"
            type="checkbox"
            value="true"
            defaultChecked={reading?.would_recommend ?? false}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
          />
          <label htmlFor="would_recommend" className="text-sm text-slate-300">
            Recomendaria
          </label>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="review" className={labelClass}>
            Resenha
          </label>
          <textarea
            id="review"
            name="review"
            rows={6}
            maxLength={5000}
            defaultValue={reading?.review}
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
      </div>
    </form>
  );
}
