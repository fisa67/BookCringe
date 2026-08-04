import { getBooks } from "@/lib/services/bookService";
import { listContents, listDatasets, listImports, listMetrics } from "@/lib/services/intelligenceDatasetService";
import { bestContentQuestion } from "@/lib/intelligence/questions/bestContent";
import { staleDatasetQuestion } from "@/lib/intelligence/questions/staleDataset";
import { unmatchedContentQuestion } from "@/lib/intelligence/questions/unmatchedContent";
import {
  activityPeakQuestion,
  followerGrowthQuestion,
  primaryAudienceQuestion,
  topTerritoryQuestion,
} from "@/lib/intelligence/questions/audience";
import {
  audienceContentMismatchQuestion,
  fastestGrowingSegmentQuestion,
  territoryGrowthOpportunityQuestion,
  underservedSegmentQuestion,
} from "@/lib/intelligence/questions/audienceStrategy";
import {
  audienceAcquisitionContentQuestion,
  engagementFormatQuestion,
  growthThemeQuestion,
  retentionContentQuestion,
} from "@/lib/intelligence/questions/contentPerformance";
import { lowestCostPerFollowerQuestion } from "@/lib/intelligence/questions/campaign";
import { runDecisionEngine } from "@/lib/intelligence/decisions";
import type { Decision } from "@/lib/intelligence/decisions";

/**
 * Ponto de entrada de I/O da Decision Engine (Sprint 11,
 * `docs/intelligence/DECISIONS_ENGINE.md`): busca os mesmos dados já
 * persistidos que o Dashboard e as Questions usam, reutilizando
 * exclusivamente os services existentes (`intelligenceDatasetService`,
 * `bookService`) — nenhuma consulta nova, nenhuma tabela nova. Calcula os
 * 3 `QuestionAnswer`s necessários (uma única vez, com os mesmos dados já
 * buscados) e delega as Decisions para `runDecisionEngine`, que só enxerga
 * QuestionAnswer, nunca os registros brutos buscados aqui.
 */
export async function getRecommendedDecisions(): Promise<Decision[]> {
  const [datasets, imports, contents, metrics, books] = await Promise.all([
    listDatasets(),
    listImports(),
    listContents(),
    listMetrics(),
    getBooks(),
  ]);

  const now = new Date();
  const audienceContext = {
    now,
    datasets: datasets ?? [],
    metrics: metrics ?? [],
  };
  const audienceStrategyContext = {
    now,
    datasets: datasets ?? [],
    metrics: metrics ?? [],
    contents: contents ?? [],
  };
  const contentPerformanceContext = {
    now,
    datasets: datasets ?? [],
    contents: contents ?? [],
    metrics: metrics ?? [],
    books: books ?? [],
  };
  const campaignContext = {
    now,
    datasets: datasets ?? [],
    imports: imports ?? [],
    metrics: metrics ?? [],
    contents: contents ?? [],
  };

  return runDecisionEngine({
    now,
    bestContent: bestContentQuestion.answer({
      now,
      datasets: datasets ?? [],
      contents: contents ?? [],
      metrics: metrics ?? [],
      books: books ?? [],
    }),
    staleDataset: staleDatasetQuestion.answer({ now, datasets: datasets ?? [], imports: imports ?? [] }),
    unmatchedContent: unmatchedContentQuestion.answer({ now, contents: contents ?? [] }),
    followerGrowth: followerGrowthQuestion.answer(audienceContext),
    activityPeak: activityPeakQuestion.answer(audienceContext),
    topTerritory: topTerritoryQuestion.answer(audienceContext),
    primaryAudience: primaryAudienceQuestion.answer(audienceContext),
    fastestGrowingSegment: fastestGrowingSegmentQuestion.answer(audienceStrategyContext),
    underservedSegment: underservedSegmentQuestion.answer(audienceStrategyContext),
    territoryGrowthOpportunity: territoryGrowthOpportunityQuestion.answer(audienceStrategyContext),
    audienceContentMismatch: audienceContentMismatchQuestion.answer(audienceStrategyContext),
    growthTheme: growthThemeQuestion.answer(contentPerformanceContext),
    engagementFormat: engagementFormatQuestion.answer(contentPerformanceContext),
    audienceAcquisitionContent: audienceAcquisitionContentQuestion.answer(contentPerformanceContext),
    retentionContent: retentionContentQuestion.answer(contentPerformanceContext),
    lowestCostPerFollower: lowestCostPerFollowerQuestion.answer(campaignContext),
  });
}
