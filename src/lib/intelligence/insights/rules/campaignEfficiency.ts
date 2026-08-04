import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import { buildCampaignDatasetSummaries, campaignEntryLabel } from "@/lib/intelligence/campaign/summary";

/**
 * Abaixo deste múltiplo, a campanha mais cara por seguidor não é
 * considerada uma discrepância de eficiência relevante — só dispersão
 * normal entre campanhas.
 */
const INEFFICIENCY_MULTIPLIER = 1.5;

/**
 * "Eficiência de campanha" (Sprint 20.5, ADR-010) — único Insight sobre
 * dado Campaign-shaped, de propósito: o escopo da Sprint pede insights
 * "apenas sobre eficiência", então esta regra não repete achados que já
 * caberiam a outra Rule (ex.: volume, recência) — só compara custo por
 * seguidor adquirido entre as campanhas de cada Dataset.
 */
export const campaignEfficiencyRule: Rule = {
  id: "campaign-efficiency",
  description: "Aponta a campanha mais e a menos eficiente em custo por seguidor adquirido.",
  evaluate({ datasets, imports, metrics, contents }): Insight[] {
    const summaries = buildCampaignDatasetSummaries(datasets, imports, metrics, contents);
    const insights: Insight[] = [];

    for (const summary of summaries) {
      const withCost = summary.entries.filter((entry) => entry.costPerFollower !== null);
      if (withCost.length === 0) continue;

      if (withCost.length === 1) {
        const [only] = withCost;
        insights.push({
          id: `campaign-efficiency:${summary.datasetId}:low-confidence`,
          ruleId: "campaign-efficiency",
          severity: "info",
          title: "Eficiência de campanha",
          message: `Low confidence: apenas uma campanha com custo por seguidor calculável em ${summary.datasetName} (${campaignEntryLabel(only)}, R$ ${only.costPerFollower!.toFixed(2)}/seguidor).`,
        });
        continue;
      }

      const sorted = [...withCost].sort((a, b) => a.costPerFollower! - b.costPerFollower!);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const inefficient = worst.costPerFollower! >= best.costPerFollower! * INEFFICIENCY_MULTIPLIER;

      insights.push({
        id: `campaign-efficiency:${summary.datasetId}`,
        ruleId: "campaign-efficiency",
        severity: inefficient ? "warning" : "info",
        title: "Eficiência de campanha",
        message: inefficient
          ? `${campaignEntryLabel(worst)} custa ${(worst.costPerFollower! / best.costPerFollower!).toFixed(1)}x mais por seguidor que ${campaignEntryLabel(best)} (R$ ${worst.costPerFollower!.toFixed(2)} vs. R$ ${best.costPerFollower!.toFixed(2)}) em ${summary.datasetName}.`
          : `${campaignEntryLabel(best)} é a campanha mais eficiente por seguidor (R$ ${best.costPerFollower!.toFixed(2)}) em ${summary.datasetName}, sem grande dispersão entre as demais.`,
      });
    }

    return insights;
  },
};
