import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";

/**
 * Decisão derivada do insight de eficiência de campanha (Sprint 20.5,
 * ADR-010) — mesmo padrão de `increaseFocusOnGrowingSegmentDecision`
 * (`decisions/rules/audienceStrategy.ts`): consome só o `QuestionAnswer`
 * que carrega o mesmo sinal do Insight (`campaignEfficiencyRule`), nunca o
 * Insight em si nem dado bruto.
 */
export const reallocateCampaignBudgetDecision: DecisionRule = {
  id: "reallocate-campaign-budget",
  description: "Recomenda realocar orçamento de mídia paga para a campanha mais eficiente por custo por seguidor.",
  evaluate({ lowestCostPerFollower }): Decision[] {
    if (!lowestCostPerFollower?.hasAnswer || !lowestCostPerFollower.data) return [];

    const { data } = lowestCostPerFollower;
    const lowConfidence = data.confidence === "low";

    return [
      {
        id: "reallocate-campaign-budget",
        title: `Realocar orçamento para ${data.campaign}`,
        description: lowConfidence
          ? `${data.campaign} tem o menor custo por seguidor medido, mas só uma campanha tem dado suficiente para comparação.`
          : `${data.campaign} é a campanha mais eficiente por custo por seguidor (R$ ${data.costPerFollower.toFixed(2)}).`,
        priority: lowConfidence ? "low" : "medium",
        recommendedAction: `Aumentar o investimento em ${data.campaign} e revisar ou pausar campanhas menos eficientes.`,
        rationale: `Based on "${lowestCostPerFollower.question}": ${lowestCostPerFollower.summary}`,
      },
    ];
  },
};
