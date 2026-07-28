import type { NewsletterCampaignStatus } from "@/lib/types/cms";

/** Mesmo padrão de `src/lib/admin/contentLabels.ts` — rótulos e classes de badge do módulo Newsletters. */
export const CAMPAIGN_STATUS_LABELS: Record<NewsletterCampaignStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  sent: "Enviada",
};

export const CAMPAIGN_STATUS_BADGE_CLASS: Record<NewsletterCampaignStatus, string> = {
  draft: "border-slate-700 bg-slate-800/60 text-slate-300",
  scheduled: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  sent: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
};
