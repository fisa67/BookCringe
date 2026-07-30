import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromotionalCampaignForm } from "@/components/admin/campaigns/PromotionalCampaignForm";
import { updatePromotionalCampaignAction } from "@/app/admin/campaigns/actions";
import { getPromotionalCampaignById } from "@/lib/services/promotionalCampaignService";

export const metadata: Metadata = {
  title: "Editar campanha — Admin BookCringe",
};

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditCampaignPage({
  params,
  searchParams,
}: EditCampaignPageProps) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const campaign = await getPromotionalCampaignById(id);

  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Campanhas</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar campanha</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <PromotionalCampaignForm
          action={updatePromotionalCampaignAction.bind(null, campaign.id)}
          campaign={campaign}
          cancelHref={`/admin/campaigns/${campaign.id}`}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
