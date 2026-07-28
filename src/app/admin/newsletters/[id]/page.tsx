import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCampaignById } from "@/lib/services/campaignService";
import { buildCampaignHtml } from "@/lib/services/campaignEmailService";
import { CAMPAIGN_STATUS_BADGE_CLASS, CAMPAIGN_STATUS_LABELS } from "@/lib/admin/newsletterCampaignLabels";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { sendTestCampaignAction, sendToCrewCampaignAction } from "@/app/admin/newsletters/actions";

export const metadata: Metadata = {
  title: "Visualizar newsletter — Admin BookCringe",
};

interface ViewNewsletterPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; testSent?: string; sent?: string }>;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function ViewNewsletterPage({ params, searchParams }: ViewNewsletterPageProps) {
  const { id } = await params;
  const { error, testSent, sent } = await searchParams;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const alreadySent = campaign.status === "sent";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crew Literário</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{campaign.title}</h1>
            <span
              className={`mt-3 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS_BADGE_CLASS[campaign.status]}`}
            >
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!alreadySent ? (
              <Link
                href={`/admin/newsletters/${campaign.id}/edit`}
                className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
              >
                Editar
              </Link>
            ) : null}
            <Link href="/admin/newsletters" className="text-sm text-slate-400 transition hover:text-slate-200">
              ← Voltar
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Criada em</dt>
            <dd className="mt-1 text-sm text-slate-200">{formatDateTime(campaign.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Enviada em</dt>
            <dd className="mt-1 text-sm text-slate-200">{formatDateTime(campaign.sent_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Destinatários</dt>
            <dd className="mt-1 text-sm text-slate-200">{campaign.recipients_count}</dd>
          </div>
        </dl>
      </div>

      {error ? (
        <p role="alert" className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {testSent ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-6 text-sm text-emerald-300">
          Teste enviado para o e-mail de contato (CONTACT_EMAIL). Confira sua caixa de entrada antes de enviar
          para o Crew.
        </p>
      ) : null}
      {sent ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-6 text-sm text-emerald-300">
          Newsletter enviada para {campaign.recipients_count} inscrito(s) confirmado(s) do Crew Literário.
        </p>
      ) : null}

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">Fluxo de envio</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Envie um teste para você mesmo, confira o resultado no seu e-mail e só depois envie para o Crew. O
          envio em massa só alcança inscritos com e-mail confirmado (<code>confirmed_at</code>) — enquanto
          ninguém tiver confirmado, o envio para o Crew não faz nada e avisa o motivo.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={sendTestCampaignAction.bind(null, campaign.id)}>
            <button
              type="submit"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Enviar teste
            </button>
          </form>

          {alreadySent ? (
            <p className="text-sm text-slate-500">
              Já enviada para o Crew em {formatDateTime(campaign.sent_at)} — não é possível enviar de novo.
            </p>
          ) : (
            <ConfirmSubmitButton
              action={sendToCrewCampaignAction.bind(null, campaign.id)}
              confirmMessage={`Enviar "${campaign.title}" para todos os inscritos confirmados do Crew Literário? Essa ação não pode ser desfeita.`}
              label="Enviar para o Crew"
              className="rounded-md border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-600 hover:bg-emerald-950/70 hover:text-emerald-200"
            />
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">Assunto</h2>
        <p className="mt-2 text-base text-white">{campaign.subject}</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">Preview do e-mail</h2>
        {/* Conteúdo escapado por `buildCampaignHtml`, escrito só pelo admin autenticado. */}
        <div
          className="mt-4 rounded-2xl border border-slate-800 bg-white p-6"
          dangerouslySetInnerHTML={{ __html: buildCampaignHtml(campaign.content) }}
        />
      </div>
    </div>
  );
}
