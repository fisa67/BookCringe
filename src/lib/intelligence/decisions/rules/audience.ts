import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";

export const respondToFollowerGrowthDecision: DecisionRule = {
  id: "respond-to-follower-growth",
  description: "Orienta a próxima ação a partir do crescimento mais recente da audiência.",
  evaluate({ followerGrowth }): Decision[] {
    if (!followerGrowth?.hasAnswer || !followerGrowth.data) return [];

    const { data } = followerGrowth;
    const isDeclining = data.growth < 0;

    return [
      {
        id: "respond-to-follower-growth",
        title: isDeclining ? "Recupere o crescimento da audiência" : "Sustente o crescimento da audiência",
        description: isDeclining
          ? `A medição mais recente registrou perda de ${Math.abs(data.growth).toLocaleString("pt-BR")} seguidor(es).`
          : `A medição mais recente registrou ganho de ${data.growth.toLocaleString("pt-BR")} seguidor(es).`,
        priority: isDeclining ? "high" : "low",
        recommendedAction: isDeclining
          ? "Revise frequência, formatos e temas publicados antes da próxima medição."
          : "Mantenha a frequência e os formatos recentes e acompanhe se o crescimento continua.",
        rationale: `Baseado na pergunta "${followerGrowth.question}": ${followerGrowth.summary}`,
      },
    ];
  },
};

export const publishAtActivityPeakDecision: DecisionRule = {
  id: "publish-at-activity-peak",
  description: "Recomenda considerar o horário de maior atividade da audiência.",
  evaluate({ activityPeak }): Decision[] {
    if (!activityPeak?.hasAnswer || !activityPeak.data) return [];

    const { data } = activityPeak;
    return [
      {
        id: "publish-at-activity-peak",
        title: "Aproveite o pico de atividade",
        description: `O maior volume observado foi às ${data.hour}h, com ${data.activeFollowers.toLocaleString("pt-BR")} seguidor(es) ativo(s).`,
        priority: "medium",
        recommendedAction: `Teste publicações próximas das ${data.hour}h e compare o desempenho nas próximas importações.`,
        rationale: `Baseado na pergunta "${activityPeak.question}": ${activityPeak.summary}`,
      },
    ];
  },
};

export const focusTopTerritoryDecision: DecisionRule = {
  id: "focus-top-audience-territory",
  description: "Destaca o território com maior participação na audiência.",
  evaluate({ topTerritory }): Decision[] {
    if (!topTerritory?.hasAnswer || !topTerritory.data) return [];

    const { data } = topTerritory;
    return [
      {
        id: "focus-top-audience-territory",
        title: "Considere o principal território",
        description: `${data.territory} concentra ${Math.round(data.share * 100)}% da audiência medida.`,
        priority: "low",
        recommendedAction: `Considere idioma, referências e horários relevantes para ${data.territory} no próximo planejamento.`,
        rationale: `Baseado na pergunta "${topTerritory.question}": ${topTerritory.summary}`,
      },
    ];
  },
};

export const servePrimaryAudienceDecision: DecisionRule = {
  id: "serve-primary-audience",
  description: "Destaca o segmento predominante na distribuição de audiência.",
  evaluate({ primaryAudience }): Decision[] {
    if (!primaryAudience?.hasAnswer || !primaryAudience.data) return [];

    const { data } = primaryAudience;
    return [
      {
        id: "serve-primary-audience",
        title: "Considere a audiência principal",
        description: `${data.label} representa ${Math.round(data.share * 100)}% da distribuição medida.`,
        priority: "low",
        recommendedAction: `Valide se linguagem, temas e formatos continuam relevantes para ${data.label}.`,
        rationale: `Baseado na pergunta "${primaryAudience.question}": ${primaryAudience.summary}`,
      },
    ];
  },
};
