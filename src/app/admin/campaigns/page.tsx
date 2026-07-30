import Link from "next/link";
import type { Metadata } from "next";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deletePromotionalCampaignAction } from "@/app/admin/campaigns/actions";
import {
  getPromotionalCampaignItems,
  getPromotionalCampaigns,
} from "@/lib/services/promotionalCampaignService";

export const metadata: Metadata = {
  title: "Campanhas promocionais — Admin BookCringe",
};

export default async function AdminCampaignsPage() {
  const campaigns = await getPromotionalCampaigns();
  const itemCounts = campaigns
    ? await Promise.all(
        campaigns.map(async (campaign) => {
          const items = await getPromotionalCampaignItems(campaign.id);
          return [campaign.id, items?.length ?? 0] as const;
        })
      )
    : [];
  const itemCountByCampaign = new Map(itemCounts);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Campanhas</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Ofertas promocionais</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Crie uma vitrine temporária para Kindle Day, Prime Day, Black Friday e outras promoções.
            </p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Nova campanha
          </Link>
        </div>
      </div>

      {campaigns === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar as campanhas. Tente novamente em alguns instantes.
        </p>
      ) : campaigns.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhuma campanha cadastrada ainda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <li
              key={campaign.id}
              className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-6"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      campaign.is_active
                        ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {campaign.is_active ? "Ativa" : "Encerrada"}
                  </span>
                  <span className="text-xs text-slate-500">/{campaign.slug}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">{campaign.name}</h2>
                {campaign.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-400">{campaign.description}</p>
                ) : null}
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {itemCountByCampaign.get(campaign.id) ?? 0} item(ns)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  Gerenciar
                </Link>
                <Link
                  href={`/admin/campaigns/${campaign.id}/edit`}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Editar
                </Link>
                <ConfirmSubmitButton
                  action={deletePromotionalCampaignAction.bind(null, campaign.id)}
                  confirmMessage={`Excluir a campanha "${campaign.name}" e todos os seus itens? Essa ação não pode ser desfeita.`}
                  label="Excluir"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
