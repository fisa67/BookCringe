import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import {
  buildParticipationChecklist,
  type BookParticipationsSummary,
} from "@/lib/adapters/bookParticipationsAdapter";

interface BookParticipationsSectionProps {
  bookId: string;
  participations: BookParticipationsSummary;
  favorite: boolean;
  wouldRecommend: boolean;
}

const cardClass = "rounded-2xl border border-slate-800 bg-slate-900/60 p-4";
const actionLinkClass =
  "mt-3 inline-flex rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white";

/**
 * Seção "Participações" de `/admin/books/[id]/edit` (aba "Visão geral" do
 * `BookIntelligenceTabs`) — mostra, num único lugar, tudo que já existe
 * sobre o livro nos demais módulos do CMS: um checklist genérico
 * (`buildParticipationChecklist`, cobre Recomendações/Campanhas/Clube/
 * Conteúdo/Avaliações e é extensível para futuras entidades) seguido dos
 * cards com atalho para criar mais. Os badges de status são só leitura
 * derivada de `participations`/`favorite`/`wouldRecommend` — nunca
 * persistidos.
 */
export function BookParticipationsSection({
  bookId,
  participations,
  favorite,
  wouldRecommend,
}: BookParticipationsSectionProps) {
  const { contentCount, hasVideoContent, campaigns, ratingsCount, ratingsAverage } = participations;
  const inCampaign = campaigns.length > 0;
  const hasAnyBadge = hasVideoContent || inCampaign || favorite || wouldRecommend;
  const checklist = buildParticipationChecklist(bookId, participations);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Biblioteca</p>
      <h2 className="mt-2 mb-1 text-xl font-semibold text-white">Participações</h2>
      <p className="mb-6 text-sm text-slate-400">
        Tudo que já existe sobre este livro nos outros módulos do CMS.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {hasVideoContent ? <Badge variant="muted">🎥 Possui conteúdo</Badge> : null}
        {inCampaign ? <Badge variant="muted">🎁 Em campanha</Badge> : null}
        {favorite ? <Badge variant="red">⭐ Favorito</Badge> : null}
        {wouldRecommend ? <Badge variant="default">👍 Recomendado</Badge> : null}
        {!hasAnyBadge ? <span className="text-sm text-slate-500">Nenhum destaque ainda.</span> : null}
      </div>

      {checklist.length > 0 ? (
        <ul className="mb-6 space-y-1.5 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          {checklist.map((item) =>
            item.href ? (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white hover:underline"
                >
                  <span className="text-emerald-400">✔</span> {item.label}
                </Link>
              </li>
            ) : (
              <li key={item.key} className="flex items-center gap-2 text-sm text-slate-200">
                <span className="text-emerald-400">✔</span> {item.label}
              </li>
            )
          )}
        </ul>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Conteúdos</p>
          <p className="mt-2 text-2xl font-semibold text-white">{contentCount}</p>
          <Link href={`/admin/content/new?bookId=${bookId}`} className={actionLinkClass}>
            + Criar conteúdo
          </Link>
        </div>

        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Campanhas</p>
          {campaigns.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nenhuma campanha ainda.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="text-sm text-slate-200 underline hover:text-white"
                  >
                    {campaign.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/admin/campaigns?bookId=${bookId}`} className={actionLinkClass}>
            + Adicionar à campanha
          </Link>
        </div>

        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avaliações</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {ratingsCount}
            {ratingsAverage !== null ? ` · ${ratingsAverage.toFixed(1)}★` : ""}
          </p>
          <Link href="/admin/ratings" className={actionLinkClass}>
            Ver avaliações
          </Link>
        </div>
      </div>
    </div>
  );
}
