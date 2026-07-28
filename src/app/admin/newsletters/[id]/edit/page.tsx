import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCampaignById } from "@/lib/services/campaignService";
import { NewsletterCampaignForm } from "@/components/admin/newsletters/NewsletterCampaignForm";
import { updateCampaignAction } from "@/app/admin/newsletters/actions";

export const metadata: Metadata = {
  title: "Editar newsletter — Admin BookCringe",
};

interface EditNewsletterPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditNewsletterPage({ params, searchParams }: EditNewsletterPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  // Campanhas já enviadas ficam imutáveis (ver `updateCampaignAction`) —
  // manda direto para a visualização em vez de mostrar um formulário que
  // não pode ser salvo.
  if (campaign.status !== "draft") {
    redirect(`/admin/newsletters/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crew Literário</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar newsletter</h1>
        <p className="mt-4 max-w-2xl text-slate-300">{campaign.title}</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <NewsletterCampaignForm
          action={updateCampaignAction.bind(null, campaign.id)}
          campaign={campaign}
          cancelHref={`/admin/newsletters/${campaign.id}`}
          submitLabel="Salvar alterações"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
