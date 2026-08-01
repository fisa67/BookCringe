import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  activatePromotionalCampaignAction,
  deletePromotionalCampaignAction,
  deletePromotionalCampaignItemAction,
} from "@/app/admin/campaigns/actions";
import {
  getPromotionalCampaignById,
  getPromotionalCampaignItems,
} from "@/lib/services/promotionalCampaignService";
import { getBooks } from "@/lib/services/bookService";
import { PROMOTIONAL_ITEM_TYPE_LABELS } from "@/lib/admin/promotionalCampaignLabels";
import { resolveCampaignItem } from "@/lib/campaigns";

export const metadata: Metadata = {
  title: "Campanha promocional — Admin BookCringe",
};

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: CampaignDetailPageProps) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const campaign = await getPromotionalCampaignById(id);

  if (!campaign) notFound();

  const [items, books] = await Promise.all([getPromotionalCampaignItems(campaign.id), getBooks()]);
  const booksById = new Map((books ?? []).map((book) => [book.id, book]));
  // `resolveCampaignItem` retorna null para itens vinculados a um livro
  // removido da Biblioteca (órfãos) — mantemos o item bruto nesse caso para
  // ainda assim mostrar um aviso e permitir excluir/reeditar o item.
  const resolvedItems = (items ?? []).map((item) => ({
    item,
    resolved: resolveCampaignItem(item, booksById),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Campanha promocional</p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  campaign.is_active
                    ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-400"
                }`}
              >
                {campaign.is_active ? "Ativa" : "Encerrada"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white">{campaign.name}</h1>
            <p className="mt-2 text-sm text-slate-400">/{campaign.slug}</p>
            {campaign.description ? (
              <p className="mt-4 max-w-2xl text-slate-300">{campaign.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/ofertas"
              target="_blank"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Ver página pública
            </Link>
            <Link
              href={`/admin/campaigns/${campaign.id}/edit`}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Editar campanha
            </Link>
            {!campaign.is_active ? (
              <form action={activatePromotionalCampaignAction.bind(null, campaign.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-700 hover:bg-emerald-950/70"
                >
                  Publicar campanha
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {campaign.banner_url ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={campaign.banner_url} alt={`Banner de ${campaign.name}`} className="max-h-72 w-full object-cover" />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-5 rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Itens da campanha</h2>
            <p className="mt-1 text-sm text-slate-400">
              {items?.length ?? 0} item(ns), ordenados pela posição informada.
            </p>
          </div>
          <Link
            href={`/admin/campaigns/${campaign.id}/items/new`}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Adicionar item
          </Link>
        </div>

        {items === null ? (
          <p className="mt-6 rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            Não foi possível carregar os itens.
          </p>
        ) : items.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            Nenhum item cadastrado ainda.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {resolvedItems.map(({ item, resolved }) => (
              <li
                key={item.id}
                className="flex min-w-0 gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-slate-950">
                  {resolved?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolved.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-slate-300">
                      {PROMOTIONAL_ITEM_TYPE_LABELS[item.item_type]}
                    </span>
                    {resolved?.bookHref ? (
                      <span className="rounded-full border border-sky-900/60 bg-sky-950/40 px-2 py-0.5 text-xs text-sky-300">
                        📚 Vinculado à Biblioteca
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        item.is_active
                          ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                          : "border-slate-700 bg-slate-950 text-slate-500"
                      }`}
                    >
                      {item.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {resolved ? (
                    <>
                      <h3 className="mt-2 truncate font-semibold text-white" title={resolved.title}>
                        {resolved.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Ordem {resolved.position}
                        {formatPrice(resolved.price) ? ` · ${formatPrice(resolved.price)}` : ""}
                      </p>
                      {resolved.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{resolved.description}</p>
                      ) : null}
                      {resolved.bookHref ? (
                        <Link
                          href={resolved.bookHref}
                          target="_blank"
                          className="mt-2 text-xs text-sky-400 underline hover:text-sky-300"
                        >
                          Ver página pública do livro
                        </Link>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-2 rounded-md border border-red-900/60 bg-red-950/40 p-2 text-xs text-red-300">
                      Livro vinculado não foi encontrado na Biblioteca (removido). Edite este item para corrigir.
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}/items/${item.id}/edit`}
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500"
                    >
                      Editar
                    </Link>
                    <ConfirmSubmitButton
                      action={deletePromotionalCampaignItemAction.bind(null, campaign.id, item.id)}
                      confirmMessage={`Remover "${resolved?.title ?? "este item"}" desta campanha?`}
                      label="Excluir"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <ConfirmSubmitButton
          action={deletePromotionalCampaignAction.bind(null, campaign.id)}
          confirmMessage={`Excluir a campanha "${campaign.name}" e todos os seus itens? Essa ação não pode ser desfeita.`}
          label="Excluir campanha"
        />
      </div>
    </div>
  );
}
