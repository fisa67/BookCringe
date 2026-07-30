import Link from "next/link";
import type { CmsPromotionalCampaignItemRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import {
  PROMOTIONAL_ITEM_TYPE_LABELS,
  PROMOTIONAL_ITEM_TYPE_VALUES,
} from "@/lib/admin/promotionalCampaignLabels";

interface PromotionalCampaignItemFormProps {
  action: (formData: FormData) => void | Promise<void>;
  item?: CmsPromotionalCampaignItemRecord;
  cancelHref: string;
  errorMessage?: string;
}

export function PromotionalCampaignItemForm({
  action,
  item,
  cancelHref,
  errorMessage,
}: PromotionalCampaignItemFormProps) {
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
          <label htmlFor="title" className={adminLabelClass}>
            Título *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={item?.title ?? ""}
            placeholder="Kindle Paperwhite"
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
            defaultValue={item?.image_url ?? ""}
            placeholder="https://... ou /images/produto.jpg"
            className={adminInputClass}
          />
          <p className="text-xs text-slate-500">Informe uma URL pública ou um path local de imagem.</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className={adminLabelClass}>
            Descrição curta
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={item?.description ?? ""}
            placeholder="Leve, compacto e ideal para ler em qualquer lugar."
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="affiliate_url" className={adminLabelClass}>
            Link afiliado *
          </label>
          <input
            id="affiliate_url"
            name="affiliate_url"
            type="url"
            required
            defaultValue={item?.affiliate_url ?? ""}
            placeholder="https://www.amazon.com.br/..."
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className={adminLabelClass}>
            Preço opcional (R$)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item?.price ?? ""}
            placeholder="39.90"
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
            defaultValue={item?.position ?? ""}
            placeholder="Adiciona ao final"
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="item_type" className={adminLabelClass}>
            Tipo *
          </label>
          <select
            id="item_type"
            name="item_type"
            required
            defaultValue={item?.item_type ?? "other"}
            className={adminInputClass}
          >
            {PROMOTIONAL_ITEM_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {PROMOTIONAL_ITEM_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={item?.is_active ?? true}
          className="mt-1 h-4 w-4 accent-red-600"
        />
        <span>
          <span className="block text-sm font-medium text-slate-200">Item ativo</span>
          <span className="mt-1 block text-xs text-slate-500">
            Itens inativos ficam ocultos na página pública, mesmo dentro de uma campanha ativa.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Salvar item
        </button>
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
