import Link from "next/link";
import type { CmsPromotionalCampaignRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface PromotionalCampaignFormProps {
  action: (formData: FormData) => void | Promise<void>;
  campaign?: CmsPromotionalCampaignRecord;
  cancelHref: string;
  errorMessage?: string;
}

export function PromotionalCampaignForm({
  action,
  campaign,
  cancelHref,
  errorMessage,
}: PromotionalCampaignFormProps) {
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
            Nome da campanha *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={150}
            defaultValue={campaign?.name ?? ""}
            placeholder="Kindle Day"
            className={adminInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className={adminLabelClass}>
            Slug *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={80}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={campaign?.slug ?? ""}
            placeholder="ofertas"
            className={adminInputClass}
          />
          <p className="text-xs text-slate-500">Use letras minúsculas, números e hífens.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="banner_url" className={adminLabelClass}>
            Banner opcional
          </label>
          <input
            id="banner_url"
            name="banner_url"
            type="text"
            maxLength={500}
            defaultValue={campaign?.banner_url ?? ""}
            placeholder="https://... ou /images/ofertas.jpg"
            className={adminInputClass}
          />
          <p className="text-xs text-slate-500">URL ou path de uma imagem exibida acima dos itens.</p>
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
            defaultValue={campaign?.description ?? ""}
            placeholder="Uma seleção de ofertas para quem gosta de ler."
            className={adminInputClass}
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={campaign?.is_active ?? false}
          className="mt-1 h-4 w-4 accent-red-600"
        />
        <span>
          <span className="block text-sm font-medium text-slate-200">Publicar campanha agora</span>
          <span className="mt-1 block text-xs text-slate-500">
            Ao publicar, a campanha ativa anterior será encerrada automaticamente.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Salvar campanha
        </button>
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
