import { getBooks } from "@/lib/services/bookService";
import { listContents, listDatasets, listImports, listMetrics } from "@/lib/services/intelligenceDatasetService";
import { bestContentQuestion } from "@/lib/intelligence/questions/bestContent";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import { staleDatasetQuestion } from "@/lib/intelligence/questions/staleDataset";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import { unmatchedContentQuestion } from "@/lib/intelligence/questions/unmatchedContent";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import {
  activityPeakQuestion,
  followerGrowthQuestion,
  primaryAudienceQuestion,
  topTerritoryQuestion,
} from "@/lib/intelligence/questions/audience";
import type {
  ActivityPeakAnswerData,
  FollowerGrowthAnswerData,
  PrimaryAudienceAnswerData,
  TopTerritoryAnswerData,
} from "@/lib/intelligence/questions/audience";
import {
  audienceContentMismatchQuestion,
  fastestGrowingSegmentQuestion,
  territoryGrowthOpportunityQuestion,
  underservedSegmentQuestion,
} from "@/lib/intelligence/questions/audienceStrategy";
import type {
  AudienceContentMismatchAnswerData,
  FastestGrowingSegmentAnswerData,
  TerritoryGrowthOpportunityAnswerData,
  UnderservedSegmentAnswerData,
} from "@/lib/intelligence/questions/audienceStrategy";
import {
  audienceAcquisitionContentQuestion,
  engagementFormatQuestion,
  growthThemeQuestion,
  retentionContentQuestion,
} from "@/lib/intelligence/questions/contentPerformance";
import type {
  AudienceAcquisitionContentAnswerData,
  EngagementFormatAnswerData,
  GrowthThemeAnswerData,
  RetentionContentAnswerData,
} from "@/lib/intelligence/questions/contentPerformance";
import {
  bestCampaignQuestion,
  highestAcquisitionQuestion,
  lowestCostPerFollowerQuestion,
} from "@/lib/intelligence/questions/campaign";
import type {
  BestCampaignAnswerData,
  HighestAcquisitionAnswerData,
  LowestCostPerFollowerAnswerData,
} from "@/lib/intelligence/questions/campaign";

/**
 * Ponto de entrada de I/O do Épico Questions (Sprint 10,
 * `docs/intelligence/QUESTIONS.md`): busca os mesmos dados já persistidos
 * que o Dashboard usa, reutilizando exclusivamente os services existentes
 * (`intelligenceDatasetService`, `bookService`) — nenhuma consulta nova,
 * nenhuma tabela nova — e delega a resposta a uma Question pura
 * (`lib/intelligence/questions/`).
 *
 * Pensado para ser chamado por qualquer consumidor futuro (Dashboard, área
 * de IA em `/admin/intelligence/ia`, ou uma API) sem que nenhum deles
 * precise saber como o dado é buscado — mesma divisão de responsabilidade
 * já usada por `intelligenceDashboardService.ts`.
 */
export async function getBestContentAnswer(): Promise<QuestionAnswer<BestContentAnswerData>> {
  const [datasets, contents, metrics, books] = await Promise.all([
    listDatasets(),
    listContents(),
    listMetrics(),
    getBooks(),
  ]);

  return bestContentQuestion.answer({
    now: new Date(),
    datasets: datasets ?? [],
    contents: contents ?? [],
    metrics: metrics ?? [],
    books: books ?? [],
  });
}

/** Mesma ideia de `getBestContentAnswer`, para a pergunta "Qual é o Dataset mais desatualizado?" (Sprint 11). */
export async function getStaleDatasetAnswer(): Promise<QuestionAnswer<StaleDatasetAnswerData>> {
  const [datasets, imports] = await Promise.all([listDatasets(), listImports()]);

  return staleDatasetQuestion.answer({ now: new Date(), datasets: datasets ?? [], imports: imports ?? [] });
}

/** Mesma ideia de `getBestContentAnswer`, para a pergunta "Quanto do meu conteúdo ainda não foi vinculado a um Livro?" (Sprint 11). */
export async function getUnmatchedContentAnswer(): Promise<QuestionAnswer<UnmatchedContentAnswerData>> {
  const contents = await listContents();

  return unmatchedContentQuestion.answer({ now: new Date(), contents: contents ?? [] });
}

export interface AudienceQuestionAnswers {
  followerGrowth: QuestionAnswer<FollowerGrowthAnswerData>;
  activityPeak: QuestionAnswer<ActivityPeakAnswerData>;
  topTerritory: QuestionAnswer<TopTerritoryAnswerData>;
  primaryAudience: QuestionAnswer<PrimaryAudienceAnswerData>;
}

export async function getAudienceAnswers(): Promise<AudienceQuestionAnswers> {
  const [datasets, metrics] = await Promise.all([listDatasets(), listMetrics()]);
  const context = {
    now: new Date(),
    datasets: datasets ?? [],
    metrics: metrics ?? [],
  };

  return {
    followerGrowth: followerGrowthQuestion.answer(context),
    activityPeak: activityPeakQuestion.answer(context),
    topTerritory: topTerritoryQuestion.answer(context),
    primaryAudience: primaryAudienceQuestion.answer(context),
  };
}

export interface AudienceStrategyQuestionAnswers {
  fastestGrowingSegment: QuestionAnswer<FastestGrowingSegmentAnswerData>;
  underservedSegment: QuestionAnswer<UnderservedSegmentAnswerData>;
  territoryGrowthOpportunity: QuestionAnswer<TerritoryGrowthOpportunityAnswerData>;
  audienceContentMismatch: QuestionAnswer<AudienceContentMismatchAnswerData>;
}

export async function getAudienceStrategyAnswers(): Promise<AudienceStrategyQuestionAnswers> {
  const [datasets, metrics, contents] = await Promise.all([
    listDatasets(),
    listMetrics(),
    listContents(),
  ]);
  const context = {
    now: new Date(),
    datasets: datasets ?? [],
    metrics: metrics ?? [],
    contents: contents ?? [],
  };

  return {
    fastestGrowingSegment: fastestGrowingSegmentQuestion.answer(context),
    underservedSegment: underservedSegmentQuestion.answer(context),
    territoryGrowthOpportunity: territoryGrowthOpportunityQuestion.answer(context),
    audienceContentMismatch: audienceContentMismatchQuestion.answer(context),
  };
}

export interface ContentPerformanceQuestionAnswers {
  growthTheme: QuestionAnswer<GrowthThemeAnswerData>;
  engagementFormat: QuestionAnswer<EngagementFormatAnswerData>;
  audienceAcquisitionContent: QuestionAnswer<AudienceAcquisitionContentAnswerData>;
  retentionContent: QuestionAnswer<RetentionContentAnswerData>;
}

export async function getContentPerformanceAnswers(): Promise<ContentPerformanceQuestionAnswers> {
  const [datasets, contents, metrics, books] = await Promise.all([
    listDatasets(),
    listContents(),
    listMetrics(),
    getBooks(),
  ]);
  const context = {
    now: new Date(),
    datasets: datasets ?? [],
    contents: contents ?? [],
    metrics: metrics ?? [],
    books: books ?? [],
  };

  return {
    growthTheme: growthThemeQuestion.answer(context),
    engagementFormat: engagementFormatQuestion.answer(context),
    audienceAcquisitionContent: audienceAcquisitionContentQuestion.answer(context),
    retentionContent: retentionContentQuestion.answer(context),
  };
}

export interface CampaignQuestionAnswers {
  bestCampaign: QuestionAnswer<BestCampaignAnswerData>;
  lowestCostPerFollower: QuestionAnswer<LowestCostPerFollowerAnswerData>;
  highestAcquisition: QuestionAnswer<HighestAcquisitionAnswerData>;
}

/** Mesma ideia de `getAudienceAnswers`, para as perguntas mínimas de Campaign Datasets (Sprint 20.5, ADR-010). */
export async function getCampaignAnswers(): Promise<CampaignQuestionAnswers> {
  const [datasets, imports, metrics, contents] = await Promise.all([
    listDatasets(),
    listImports(),
    listMetrics(),
    listContents(),
  ]);
  const context = {
    now: new Date(),
    datasets: datasets ?? [],
    imports: imports ?? [],
    metrics: metrics ?? [],
    contents: contents ?? [],
  };

  return {
    bestCampaign: bestCampaignQuestion.answer(context),
    lowestCostPerFollower: lowestCostPerFollowerQuestion.answer(context),
    highestAcquisition: highestAcquisitionQuestion.answer(context),
  };
}
