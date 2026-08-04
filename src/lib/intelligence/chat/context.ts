import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { Insight } from "@/lib/intelligence/insights/types";
import type { Decision } from "@/lib/intelligence/decisions/types";
import type { IntelligenceChatContextItem } from "@/lib/intelligence/chat/types";

interface BuildContextItemsInput {
  /** `undefined` é aceito para simplificar quem chama (`DecisionContext` já tem vários campos opcionais). */
  questionAnswers: Array<QuestionAnswer<unknown> | undefined>;
  insights: Insight[];
  decisions: Decision[];
}

/**
 * Achata as três fontes de inteligência já existentes (Questions, Insights,
 * Decisions) em uma lista única de textos prontos para leitura — pura, sem
 * I/O. Quem busca os dados é sempre `intelligenceChatService` (reaproveitando
 * `intelligenceQuestionsService`/`intelligenceDashboardService`/
 * `intelligenceDecisionsService`, nunca uma consulta nova).
 *
 * `QuestionAnswer`s sem resposta (`hasAnswer: false`) são descartadas: não
 * há dado nenhum por trás delas, e incluir seriam apenas ruído para o LLM.
 */
export function buildContextItems({
  questionAnswers,
  insights,
  decisions,
}: BuildContextItemsInput): IntelligenceChatContextItem[] {
  const items: IntelligenceChatContextItem[] = [];

  for (const answer of questionAnswers) {
    if (!answer || !answer.hasAnswer) continue;
    items.push({
      id: `question:${answer.questionId}`,
      kind: "question",
      title: answer.question,
      text: answer.summary,
    });
  }

  for (const insight of insights) {
    items.push({
      id: `insight:${insight.id}`,
      kind: "insight",
      title: insight.title,
      text: insight.message,
    });
  }

  for (const decision of decisions) {
    items.push({
      id: `decision:${decision.id}`,
      kind: "decision",
      title: decision.title,
      text: `${decision.description} Ação recomendada: ${decision.recommendedAction}`,
    });
  }

  return items;
}
