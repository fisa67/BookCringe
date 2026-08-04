import { generateText } from "ai";
import {
  getAudienceAnswers,
  getAudienceStrategyAnswers,
  getBestContentAnswer,
  getCampaignAnswers,
  getContentPerformanceAnswers,
  getStaleDatasetAnswer,
  getUnmatchedContentAnswer,
} from "@/lib/services/intelligenceQuestionsService";
import { getRecommendedDecisions } from "@/lib/services/intelligenceDecisionsService";
import { getIntelligenceDashboardData } from "@/lib/services/intelligenceDashboardService";
import { buildContextItems } from "@/lib/intelligence/chat/context";
import { selectRelevantContext } from "@/lib/intelligence/chat/intent";
import { buildChatPrompt } from "@/lib/intelligence/chat/prompt";
import { getIntelligenceChatModel } from "@/lib/intelligence/chat/provider";
import type { IntelligenceChatResult } from "@/lib/intelligence/chat/types";

const MISCONFIGURED_MESSAGE =
  "O Chat de Intelligence ainda não foi configurado. Peça a um administrador para configurar o provedor de IA (variáveis INTELLIGENCE_CHAT_*).";
const PROVIDER_ERROR_MESSAGE =
  "Não foi possível consultar o provedor de IA agora. Verifique a configuração e tente novamente em instantes.";
const EMPTY_QUESTION_MESSAGE = "Digite uma pergunta para o Chat de Intelligence.";
const EMPTY_REPLY_MESSAGE = "Não foi possível gerar uma resposta agora. Tente novamente em instantes.";

/**
 * Ponto de entrada de I/O do Intelligence Chat (Sprint 23,
 * `/admin/intelligence/chat`): reaproveita exclusivamente os services de
 * inteligência já existentes —
 * `intelligenceQuestionsService` (Questions, Sprint 10 — primeiro consumidor
 * real em produção destes getters),
 * `intelligenceDashboardService` (Insights, Sprint 9, via
 * `IntelligenceDashboardData.insights`) e
 * `intelligenceDecisionsService` (Decisions, Sprint 11) — nunca consulta um
 * Dataset/Import/Content/Metric diretamente. Nenhuma inteligência nova é
 * criada aqui: a única camada nova é a seleção de contexto relevante
 * (`chat/intent.ts`, determinística) e a chamada ao LLM para gerar uma
 * resposta amigável em português a partir do que já existe.
 */
export async function askIntelligenceChat(question: string): Promise<IntelligenceChatResult> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    return { status: "error", message: EMPTY_QUESTION_MESSAGE };
  }

  const model = getIntelligenceChatModel();
  if (!model) {
    return { status: "error", message: MISCONFIGURED_MESSAGE };
  }

  const [bestContent, staleDataset, unmatchedContent, audience, audienceStrategy, contentPerformance, campaign, decisions, dashboard] =
    await Promise.all([
      getBestContentAnswer(),
      getStaleDatasetAnswer(),
      getUnmatchedContentAnswer(),
      getAudienceAnswers(),
      getAudienceStrategyAnswers(),
      getContentPerformanceAnswers(),
      getCampaignAnswers(),
      getRecommendedDecisions(),
      getIntelligenceDashboardData(),
    ]);

  const items = buildContextItems({
    questionAnswers: [
      bestContent,
      staleDataset,
      unmatchedContent,
      audience.followerGrowth,
      audience.activityPeak,
      audience.topTerritory,
      audience.primaryAudience,
      audienceStrategy.fastestGrowingSegment,
      audienceStrategy.underservedSegment,
      audienceStrategy.territoryGrowthOpportunity,
      audienceStrategy.audienceContentMismatch,
      contentPerformance.growthTheme,
      contentPerformance.engagementFormat,
      contentPerformance.audienceAcquisitionContent,
      contentPerformance.retentionContent,
      campaign.bestCampaign,
      campaign.lowestCostPerFollower,
      campaign.highestAcquisition,
    ],
    insights: dashboard.insights,
    decisions,
  });

  const relevantItems = selectRelevantContext(trimmedQuestion, items);
  const prompt = buildChatPrompt(trimmedQuestion, relevantItems);

  try {
    const { text } = await generateText({ model, system: prompt.system, prompt: prompt.user });
    const reply = text.trim();

    if (!reply) {
      return { status: "error", message: EMPTY_REPLY_MESSAGE };
    }

    return { status: "ok", reply, usedContext: relevantItems.map((item) => item.id) };
  } catch {
    return { status: "error", message: PROVIDER_ERROR_MESSAGE };
  }
}
