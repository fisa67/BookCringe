import Link from "next/link";
import type { Metadata } from "next";
import { getCampaigns, getLatestSentCampaign } from "@/lib/services/campaignService";
import { getSubscribersConfirmationCounts, getSubscribersGrowth } from "@/lib/services/subscriberService";
import { CAMPAIGN_STATUS_BADGE_CLASS, CAMPAIGN_STATUS_LABELS } from "@/lib/admin/newsletterCampaignLabels";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteCampaignAction, duplicateCampaignAction } from "@/app/admin/newsletters/actions";

export const metadata: Metadata = {
  title: "Newsletters — Admin BookCringe",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminNewslettersPage() {
  const [campaigns, confirmationCounts, growth, latestSent] = await Promise.all([
    getCampaigns(),
    getSubscribersConfirmationCounts(),
    getSubscribersGrowth(),
    getLatestSentCampaign(),
  ]);

  const totalSubscribers = confirmationCounts
    ? confirmationCounts.confirmed + confirmationCounts.unconfirmed
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crew Literário</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Newsletters</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Crie, salve como rascunho, teste e envie newsletters para os inscritos confirmados do Crew
              Literário. Sem automações, agendamento real ou segmentação avançada nesta fase.
            </p>
          </div>
          <Link
            href="/admin/newsletters/new"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Nova newsletter
          </Link>
        </div>
      </div>

      <section aria-label="Painel do Crew Literário" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total de inscritos</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totalSubscribers ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Confirmados</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-400">{confirmationCounts?.confirmed ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Última campanha enviada</p>
          <p className="mt-3 truncate text-lg font-semibold text-white">
            {latestSent ? latestSent.title : "Nenhuma ainda"}
          </p>
          {latestSent ? (
            <p className="mt-1 text-sm text-slate-400">{formatDateTime(latestSent.sent_at)}</p>
          ) : null}
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Crescimento (30 dias)</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {growth && growth.growthPct !== null ? `${growth.growthPct}%` : "—"}
          </p>
          {growth ? <p className="mt-1 text-sm text-slate-400">{growth.last30Days} novo(s) inscrito(s)</p> : null}
        </div>
      </section>

      {campaigns === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar as newsletters. Tente novamente em alguns instantes.
        </p>
      ) : campaigns.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhuma newsletter criada ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((campaign) => (
            <li
              key={campaign.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
            >
              <div className="min-w-0 flex-1">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS_BADGE_CLASS[campaign.status]}`}
                >
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </span>
                <p className="mt-2 truncate text-base font-semibold text-white">{campaign.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span>Criada em {formatDateTime(campaign.created_at)}</span>
                  <span>Enviada em {formatDateTime(campaign.sent_at)}</span>
                  <span>{campaign.recipients_count} destinatário(s)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/newsletters/${campaign.id}`}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  Visualizar
                </Link>
                {campaign.status === "draft" ? (
                  <Link
                    href={`/admin/newsletters/${campaign.id}/edit`}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                  >
                    Editar
                  </Link>
                ) : null}
                <form action={duplicateCampaignAction.bind(null, campaign.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                  >
                    Duplicar
                  </button>
                </form>
                <ConfirmSubmitButton
                  action={deleteCampaignAction.bind(null, campaign.id)}
                  confirmMessage={`Remover a newsletter "${campaign.title}"? Essa ação não pode ser desfeita.`}
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
