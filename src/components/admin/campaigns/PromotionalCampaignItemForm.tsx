import Link from "next/link";
import type { CmsBookRecord, CmsPromotionalCampaignItemRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import { CampaignItemSourceFields } from "@/components/admin/campaigns/CampaignItemSourceFields";

interface PromotionalCampaignItemFormProps {
  action: (formData: FormData) => void | Promise<void>;
  books: CmsBookRecord[];
  item?: CmsPromotionalCampaignItemRecord;
  cancelHref: string;
  errorMessage?: string;
  /** Pré-seleciona o livro ao vir de "Ações rápidas"/"Adicionar à campanha" (Biblioteca). */
  defaultBookId?: string;
}

/**
 * Formulário de item de campanha (criar/editar). A escolha entre "livro da
 * Biblioteca" e "produto manual" fica em `CampaignItemSourceFields` (ilha
 * client, mesmo padrão de `ContentAssociationFields`) — `title`/`image_url`/
 * `description`/`affiliate_url`/`item_type` só aparecem no fluxo manual;
 * `price`, `position` e `is_active` são comuns aos dois, pois não duplicam
 * nenhuma informação da Biblioteca (preço/ordem/ativo são sempre da
 * campanha, nunca do livro).
 */
export function PromotionalCampaignItemForm({
  action,
  books,
  item,
  cancelHref,
  errorMessage,
  defaultBookId,
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
        <CampaignItemSourceFields books={books} item={item} defaultBookId={defaultBookId} />

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
