import type { Metadata } from "next";
import { PromotionalCampaignForm } from "@/components/admin/campaigns/PromotionalCampaignForm";
import { createPromotionalCampaignAction } from "@/app/admin/campaigns/actions";

export const metadata: Metadata = {
  title: "Nova campanha — Admin BookCringe",
};

interface NewCampaignPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewCampaignPage({ searchParams }: NewCampaignPageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Campanhas</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Nova campanha</h1>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <PromotionalCampaignForm
          action={createPromotionalCampaignAction}
          cancelHref="/admin/campaigns"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
