import Link from "next/link";
import type { CmsStoreProductRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface StoreProductFormProps {
  action: (formData: FormData) => void | Promise<void>;
  product?: CmsStoreProductRecord;
  cancelHref: string;
  errorMessage?: string;
}

export function StoreProductForm({
  action,
  product,
  cancelHref,
  errorMessage,
}: StoreProductFormProps) {
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
            Nome do produto *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={200}
            defaultValue={product?.name ?? ""}
            placeholder="Camiseta BookCringe"
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
            defaultValue={product?.description ?? ""}
            placeholder="Uma peça para quem carrega a leitura por fora."
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="image_url" className={adminLabelClass}>
            Imagem *
          </label>
          <input
            id="image_url"
            name="image_url"
            type="text"
            required
            maxLength={500}
            defaultValue={product?.image_url ?? ""}
            placeholder="https://... ou /images/store/camiseta.jpg"
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className={adminLabelClass}>
            Preço (R$) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={product?.price ?? ""}
            placeholder="79.90"
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="quantity" className={adminLabelClass}>
            Quantidade *
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            min={0}
            step={1}
            defaultValue={product?.quantity ?? 0}
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="position" className={adminLabelClass}>
            Ordem
          </label>
          <input
            id="position"
            name="position"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.position ?? ""}
            placeholder="Adiciona ao final"
            className={adminInputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
            className="mt-1 h-4 w-4 accent-red-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-200">Produto ativo</span>
            <span className="mt-1 block text-xs text-slate-500">Exibe o produto na Store.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4">
          <input
            type="checkbox"
            name="crew_exclusive"
            defaultChecked={product?.crew_exclusive ?? false}
            className="mt-1 h-4 w-4 accent-red-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-200">Exclusivo do Crew</span>
            <span className="mt-1 block text-xs text-slate-500">Exibe o selo especial no card.</span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Salvar produto
        </button>
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
