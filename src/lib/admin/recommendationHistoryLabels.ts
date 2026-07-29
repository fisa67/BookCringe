/**
 * Lógica pura de exibição da tabela de histórico em `/admin/recommendations`
 * — separada do service (que fala com o Supabase) para poder ser testada
 * sem mock de banco, mesmo padrão de `subscriberSocialProof.ts`.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Dias em destaque de uma entrada do histórico — `endedAt` (ou `now`, para
 * a recomendação atual) menos `startedAt`, arredondado para o inteiro mais
 * próximo. Nunca devolve menos que 1: mesmo uma recomendação encerrada no
 * mesmo dia em que começou já contou como "1 dia em destaque" para efeito
 * editorial (não faz sentido mostrar "0 dias").
 */
export function computeDaysHighlighted(startedAt: string, endedAt: string | null, now: Date = new Date()): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : now.getTime();
  const days = Math.round((end - start) / MS_PER_DAY);
  return Math.max(1, days);
}

export type RecommendationHistoryStatus = "active" | "ended";

export function getRecommendationHistoryStatus(endedAt: string | null): RecommendationHistoryStatus {
  return endedAt ? "ended" : "active";
}

export const RECOMMENDATION_HISTORY_STATUS_LABELS: Record<RecommendationHistoryStatus, string> = {
  active: "Ativa",
  ended: "Encerrada",
};

export const RECOMMENDATION_HISTORY_STATUS_BADGE_CLASS: Record<RecommendationHistoryStatus, string> = {
  active: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
  ended: "border-slate-700 bg-slate-900 text-slate-400",
};
