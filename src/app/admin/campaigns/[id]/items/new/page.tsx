import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromotionalCampaignItemForm } from "@/components/admin/campaigns/PromotionalCampaignItemForm";
import { createPromotionalCampaignItemAction } from "@/app/admin/campaigns/actions";
import { getPromotionalCampaignById } from "@/lib/services/promotionalCampaignService";
import { getBooks } from "@/lib/services/bookService";

export const metadata: Metadata = {
  title: "Novo item — Admin BookCringe",
};

interface NewCampaignItemPageProps {
  params: Promise<{ id: string }>;
  /** `bookId` chega do atalho "Adicionar à campanha" (Biblioteca) para pré-selecionar o livro. */
  searchParams: Promise<{ error?: string; bookId?: string }>;
}

export default async function NewCampaignItemPage({
  params,
  searchParams,
}: NewCampaignItemPageProps) {
  const [{ id }, { error, bookId }] = await Promise.all([params, searchParams]);
  const [campaign, books] = await Promise.all([getPromotionalCampaignById(id), getBooks()]);

  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{campaign.name}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Adicionar item</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <PromotionalCampaignItemForm
          action={createPromotionalCampaignItemAction.bind(null, campaign.id)}
          books={books ?? []}
          cancelHref={`/admin/campaigns/${campaign.id}`}
          errorMessage={error}
          defaultBookId={bookId}
        />
      </div>
    </div>
  );
}
