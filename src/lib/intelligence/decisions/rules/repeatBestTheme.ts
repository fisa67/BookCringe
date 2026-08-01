import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";

/**
 * "Repita o que já funcionou": lê exclusivamente o `QuestionAnswer` de
 * `bestContentQuestion` (`questions/bestContent.ts`) — nunca recalcula
 * "o melhor conteúdo" por conta própria. Sempre que há uma resposta, vale
 * a pena sugerir repetir o tema — diferente das outras duas Decisions,
 * não há um limiar de "isso é grave o suficiente", porque destacar o
 * melhor conteúdo é sempre uma recomendação de baixo risco.
 */
export const repeatBestThemeDecision: DecisionRule = {
  id: "repeat-best-theme",
  description: "Recomenda repetir o tema do conteúdo com melhor desempenho, quando existir um.",
  evaluate({ bestContent }): Decision[] {
    if (!bestContent.hasAnswer || !bestContent.data) return [];

    const { data } = bestContent;
    const platformLabel = PLATFORM_LABELS[data.platform] ?? data.platform;

    return [
      {
        id: "repeat-best-theme",
        title: "Repita o que já funcionou",
        description: `"${data.title}" (${platformLabel}) foi o conteúdo com melhor desempenho entre os importados. Um novo conteúdo sobre o mesmo tema tende a repetir esse resultado.`,
        priority: "medium",
        recommendedAction: data.bookTitle
          ? `Planeje um novo conteúdo sobre "${data.bookTitle}" ou um tema semelhante.`
          : `Planeje um novo conteúdo com um tema semelhante ao de "${data.title}".`,
        rationale: `Baseado na pergunta "${bestContent.question}": ${bestContent.summary}`,
      },
    ];
  },
};
