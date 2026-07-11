import Link from "next/link";
import type { CmsBookClubYearRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface YearFormProps {
  action: (formData: FormData) => void | Promise<void>;
  year?: CmsBookClubYearRecord;
  submitLabel: string;
  errorMessage?: string;
}

export function YearForm({ action, year, submitLabel, errorMessage }: YearFormProps) {
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
        <div className="space-y-2">
          <label htmlFor="year" className={adminLabelClass}>
            Ano *
          </label>
          <input
            id="year"
            name="year"
            type="number"
            required
            min={1900}
            max={3000}
            defaultValue={year?.year}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className={adminLabelClass}>
            Título
          </label>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={150}
            placeholder="Ex.: Temporada 2026"
            defaultValue={year?.title}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="notes" className={adminLabelClass}>
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={year?.notes}
            className={adminInputClass}
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
          href="/admin/bookclub"
          className="text-sm text-slate-400 transition hover:text-slate-200"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
