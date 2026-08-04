import { describe, expect, it, vi, beforeEach } from "vitest";
import { askIntelligenceChat } from "./intelligenceChatService";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { Decision } from "@/lib/intelligence/decisions/types";
import type { IntelligenceDashboardData } from "@/lib/intelligence/dashboard/types";

const {
  getBestContentAnswerMock,
  getStaleDatasetAnswerMock,
  getUnmatchedContentAnswerMock,
  getAudienceAnswersMock,
  getAudienceStrategyAnswersMock,
  getContentPerformanceAnswersMock,
  getCampaignAnswersMock,
  getRecommendedDecisionsMock,
  getIntelligenceDashboardDataMock,
  getIntelligenceChatModelMock,
  generateTextMock,
} = vi.hoisted(() => ({
  getBestContentAnswerMock: vi.fn(),
  getStaleDatasetAnswerMock: vi.fn(),
  getUnmatchedContentAnswerMock: vi.fn(),
  getAudienceAnswersMock: vi.fn(),
  getAudienceStrategyAnswersMock: vi.fn(),
  getContentPerformanceAnswersMock: vi.fn(),
  getCampaignAnswersMock: vi.fn(),
  getRecommendedDecisionsMock: vi.fn(),
  getIntelligenceDashboardDataMock: vi.fn(),
  getIntelligenceChatModelMock: vi.fn(),
  generateTextMock: vi.fn(),
}));

vi.mock("@/lib/services/intelligenceQuestionsService", () => ({
  getBestContentAnswer: getBestContentAnswerMock,
  getStaleDatasetAnswer: getStaleDatasetAnswerMock,
  getUnmatchedContentAnswer: getUnmatchedContentAnswerMock,
  getAudienceAnswers: getAudienceAnswersMock,
  getAudienceStrategyAnswers: getAudienceStrategyAnswersMock,
  getContentPerformanceAnswers: getContentPerformanceAnswersMock,
  getCampaignAnswers: getCampaignAnswersMock,
}));

vi.mock("@/lib/services/intelligenceDecisionsService", () => ({
  getRecommendedDecisions: getRecommendedDecisionsMock,
}));

vi.mock("@/lib/services/intelligenceDashboardService", () => ({
  getIntelligenceDashboardData: getIntelligenceDashboardDataMock,
}));

vi.mock("@/lib/intelligence/chat/provider", () => ({
  getIntelligenceChatModel: getIntelligenceChatModelMock,
}));

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

function noAnswer(questionId: string): QuestionAnswer<unknown> {
  return {
    questionId,
    question: `Pergunta ${questionId}`,
    answeredAt: "2026-01-01T00:00:00.000Z",
    hasAnswer: false,
    data: null,
    summary: "Sem dado suficiente.",
  };
}

const BEST_CONTENT_ANSWER: QuestionAnswer<unknown> = {
  questionId: "best-content",
  question: "Qual foi o conteúdo com melhor desempenho?",
  answeredAt: "2026-01-01T00:00:00.000Z",
  hasAnswer: true,
  data: { title: "Vídeo X" },
  summary: "O vídeo 'Vídeo X' teve o melhor desempenho, com 10.000 visualizações.",
};

const RECOMMENDED_DECISION: Decision = {
  id: "repeat-best-theme",
  title: "Repita o tema de maior sucesso",
  description: "O tema Y teve o melhor engajamento.",
  priority: "high",
  recommendedAction: "Planeje um novo conteúdo sobre Y.",
  rationale: "best-content",
};

function setupHappyPathMocks() {
  getBestContentAnswerMock.mockResolvedValue(BEST_CONTENT_ANSWER);
  getStaleDatasetAnswerMock.mockResolvedValue(noAnswer("stale-dataset"));
  getUnmatchedContentAnswerMock.mockResolvedValue(noAnswer("unmatched-content"));
  getAudienceAnswersMock.mockResolvedValue({
    followerGrowth: noAnswer("follower-growth"),
    activityPeak: noAnswer("activity-peak"),
    topTerritory: noAnswer("top-territory"),
    primaryAudience: noAnswer("primary-audience"),
  });
  getAudienceStrategyAnswersMock.mockResolvedValue({
    fastestGrowingSegment: noAnswer("fastest-growing-segment"),
    underservedSegment: noAnswer("underserved-segment"),
    territoryGrowthOpportunity: noAnswer("territory-growth-opportunity"),
    audienceContentMismatch: noAnswer("audience-content-mismatch"),
  });
  getContentPerformanceAnswersMock.mockResolvedValue({
    growthTheme: noAnswer("growth-theme"),
    engagementFormat: noAnswer("engagement-format"),
    audienceAcquisitionContent: noAnswer("audience-acquisition-content"),
    retentionContent: noAnswer("retention-content"),
  });
  getCampaignAnswersMock.mockResolvedValue({
    bestCampaign: noAnswer("best-campaign"),
    lowestCostPerFollower: noAnswer("lowest-cost-per-follower"),
    highestAcquisition: noAnswer("highest-acquisition"),
  });
  getRecommendedDecisionsMock.mockResolvedValue([RECOMMENDED_DECISION]);
  getIntelligenceDashboardDataMock.mockResolvedValue({ insights: [] } as unknown as IntelligenceDashboardData);
  getIntelligenceChatModelMock.mockReturnValue({ modelId: "mock-model" });
}

describe("askIntelligenceChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro amigável, sem chamar nenhum service, quando a pergunta está vazia", async () => {
    const result = await askIntelligenceChat("   ");

    expect(result).toEqual({ status: "error", message: expect.stringContaining("Digite uma pergunta") });
    expect(getBestContentAnswerMock).not.toHaveBeenCalled();
  });

  it("retorna erro amigável, sem chamar nenhum service de dados, quando não há provedor de IA configurado", async () => {
    getIntelligenceChatModelMock.mockReturnValue(null);

    const result = await askIntelligenceChat("Qual foi o melhor conteúdo?");

    expect(result).toEqual({
      status: "error",
      message: expect.stringContaining("ainda não foi configurado"),
    });
    expect(getBestContentAnswerMock).not.toHaveBeenCalled();
  });

  it("consulta Questions/Insights/Decisions já existentes e envia o contexto relevante ao LLM", async () => {
    setupHappyPathMocks();
    generateTextMock.mockResolvedValue({ text: "O vídeo 'Vídeo X' foi o destaque, com ótimo desempenho!" });

    const result = await askIntelligenceChat("Qual foi o conteúdo com melhor desempenho?");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected ok result");
    expect(result.reply).toBe("O vídeo 'Vídeo X' foi o destaque, com ótimo desempenho!");
    expect(result.usedContext).toContain("question:best-content");

    expect(generateTextMock).toHaveBeenCalledTimes(1);
    const call = generateTextMock.mock.calls[0][0];
    expect(call.model).toEqual({ modelId: "mock-model" });
    expect(call.user ?? call.prompt).toContain("Vídeo X");
  });

  it("nunca lança e devolve erro amigável quando o provedor de IA falha", async () => {
    setupHappyPathMocks();
    generateTextMock.mockRejectedValue(new Error("network error"));

    const result = await askIntelligenceChat("Qual foi o conteúdo com melhor desempenho?");

    expect(result).toEqual({
      status: "error",
      message: expect.stringContaining("Não foi possível consultar o provedor de IA"),
    });
  });

  it("retorna erro amigável quando o LLM responde com texto vazio", async () => {
    setupHappyPathMocks();
    generateTextMock.mockResolvedValue({ text: "   " });

    const result = await askIntelligenceChat("Qual foi o conteúdo com melhor desempenho?");

    expect(result).toEqual({
      status: "error",
      message: expect.stringContaining("Não foi possível gerar uma resposta"),
    });
  });
});
