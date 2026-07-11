import Link from "next/link";
import type { CmsBookClubMonthRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface MonthFormProps {
  action: (formData: FormData) => void | Promise<void>;
  month?: CmsBookClubMonthRecord;
  cancelHref: string;
  submitLabel: string;
  errorMessage?: string;
}

function metadataDate(month: CmsBookClubMonthRecord | undefined, key: "start_date" | "end_date") {
  const value = month?.metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Formulário de mês (criar/editar). `start_date`/`end_date` não existem como
 * colunas no schema — são guardados em `metadata` (ver `clubService`),
 * usado aqui só para preencher os valores padrão dos campos de data.
 */
export function MonthForm({ action, month, cancelHref, submitLabel, errorMessage }: MonthFormProps) {
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
          <label htmlFor="month" className={adminLabelClass}>
            Mês (1–12) *
          </label>
          <input
            id="month"
            name="month"
            type="number"
            required
            min={1}
            max={12}
            defaultValue={month?.month}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="theme" className={adminLabelClass}>
            Tema
          </label>
          <input
            id="theme"
            name="theme"
            type="text"
            maxLength={150}
            placeholder="Ex.: Terror nacional"
            defaultValue={month?.theme}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="start_date" className={adminLabelClass}>
            Data de início
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={metadataDate(month, "start_date")}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="end_date" className={adminLabelClass}>
            Data de término
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={metadataDate(month, "end_date")}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="notes" className={adminLabelClass}>
            Descrição / notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={month?.notes}
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
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
