import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromotionalCampaignItemForm } from "@/components/admin/campaigns/PromotionalCampaignItemForm";
import { updatePromotionalCampaignItemAction } from "@/app/admin/campaigns/actions";
import {
  getPromotionalCampaignById,
  getPromotionalCampaignItems,
} from "@/lib/services/promotionalCampaignService";
import { getBooks } from "@/lib/services/bookService";

export const metadata: Metadata = {
  title: "Editar item — Admin BookCringe",
};

interface EditCampaignItemPageProps {
  params: Promise<{ id: string; itemId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditCampaignItemPage({
  params,
  searchParams,
}: EditCampaignItemPageProps) {
  const [{ id, itemId }, { error }] = await Promise.all([params, searchParams]);
  const [campaign, items, books] = await Promise.all([
    getPromotionalCampaignById(id),
    getPromotionalCampaignItems(id),
    getBooks(),
  ]);
  const item = items?.find((candidate) => candidate.id === itemId);

  if (!campaign || !item) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{campaign.name}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar item</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <PromotionalCampaignItemForm
          action={updatePromotionalCampaignItemAction.bind(null, campaign.id, item.id)}
          books={books ?? []}
          item={item}
          cancelHref={`/admin/campaigns/${campaign.id}`}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
