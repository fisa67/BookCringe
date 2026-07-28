import type { Metadata } from "next";
import { NewsletterCampaignForm } from "@/components/admin/newsletters/NewsletterCampaignForm";
import { createCampaignAction } from "@/app/admin/newsletters/actions";

export const metadata: Metadata = {
  title: "Nova newsletter — Admin BookCringe",
};

interface NewNewsletterPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewNewsletterPage({ searchParams }: NewNewsletterPageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crew Literário</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Nova newsletter</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Salva como rascunho — nada é enviado até você usar &quot;Enviar teste&quot; e depois &quot;Enviar para o
          Crew&quot; na página de visualização.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <NewsletterCampaignForm
          action={createCampaignAction}
          cancelHref="/admin/newsletters"
          submitLabel="Salvar rascunho"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
