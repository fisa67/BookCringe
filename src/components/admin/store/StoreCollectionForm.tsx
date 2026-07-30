import Link from "next/link";
import type { CmsStoreCollectionRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface StoreCollectionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  collection?: CmsStoreCollectionRecord;
  cancelHref: string;
  errorMessage?: string;
}

export function StoreCollectionForm({
  action,
  collection,
  cancelHref,
  errorMessage,
}: StoreCollectionFormProps) {
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="name" className={adminLabelClass}>
            Nome da coleção *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={150}
            defaultValue={collection?.name ?? ""}
            placeholder="Crew Collection #001"
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className={adminLabelClass}>
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={collection?.description ?? ""}
            placeholder="Primeira tiragem. 50 unidades. Edição limitada."
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="total_quantity" className={adminLabelClass}>
            Quantidade total
          </label>
          <input
            id="total_quantity"
            type="text"
            value={`${collection?.total_quantity ?? 0} unidades`}
            readOnly
            className={`${adminInputClass} cursor-not-allowed opacity-70`}
          />
          <p className="text-xs text-slate-500">Calculada pela soma das quantidades dos produtos.</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={collection?.is_active ?? false}
          className="mt-1 h-4 w-4 accent-red-600"
        />
        <span>
          <span className="block text-sm font-medium text-slate-200">Publicar coleção</span>
          <span className="mt-1 block text-xs text-slate-500">
            Coleções ativas e seus produtos ativos aparecem na Store pública.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Salvar coleção
        </button>
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
