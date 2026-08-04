import type { QuestionAnswer } from "@/lib/intelligence/questions/types";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";
import type {
  ActivityPeakAnswerData,
  FollowerGrowthAnswerData,
  PrimaryAudienceAnswerData,
  TopTerritoryAnswerData,
} from "@/lib/intelligence/questions/audience";
import type {
  AudienceContentMismatchAnswerData,
  FastestGrowingSegmentAnswerData,
  TerritoryGrowthOpportunityAnswerData,
  UnderservedSegmentAnswerData,
} from "@/lib/intelligence/questions/audienceStrategy";
import type {
  AudienceAcquisitionContentAnswerData,
  EngagementFormatAnswerData,
  GrowthThemeAnswerData,
  RetentionContentAnswerData,
} from "@/lib/intelligence/questions/contentPerformance";
import type { LowestCostPerFollowerAnswerData } from "@/lib/intelligence/questions/campaign";

/**
 * Decision Engine (Sprint 11, `docs/intelligence/DECISIONS_ENGINE.md`):
 * segunda camada de inteligência baseada em regras — sem IA, sem LLM,
 * mesma restrição já aplicada ao Rules Engine de Insights (Sprint 9).
 *
 * Diferença central em relação aos Insights: uma Insight
 * (`insights/types.ts#Rule`) lê Dataset/Import/Content/Metric diretamente.
 * Uma Decision só enxerga `QuestionAnswer`s já calculados pela biblioteca
 * de perguntas (`lib/intelligence/questions/`, Sprint 10) — nunca um
 * registro persistido bruto. Isso mantém a Decision Engine desacoplada de
 * como cada resposta foi calculada: trocar a lógica interna de uma
 * Question nunca deveria exigir mudar uma Decision.
 */

export type DecisionPriority = "low" | "medium" | "high";

export interface Decision {
  id: string;
  title: string;
  description: string;
  priority: DecisionPriority;
  recommendedAction: string;
  /** Sempre referencia a pergunta/resposta que a originou — nunca uma afirmação genérica sem dado por trás. */
  rationale: string;
}

/**
 * Tudo que uma DecisionRule pode enxergar: só QuestionAnswers, nunca dado
 * cru. `now` é injetável — mesmo padrão do `RuleContext` dos Insights —
 * ainda que nenhuma regra desta sprint precise dele diretamente (cada
 * QuestionAnswer já embute seu próprio `answeredAt`).
 */
export interface DecisionContext {
  now: Date;
  bestContent: QuestionAnswer<BestContentAnswerData>;
  staleDataset: QuestionAnswer<StaleDatasetAnswerData>;
  unmatchedContent: QuestionAnswer<UnmatchedContentAnswerData>;
  followerGrowth?: QuestionAnswer<FollowerGrowthAnswerData>;
  activityPeak?: QuestionAnswer<ActivityPeakAnswerData>;
  topTerritory?: QuestionAnswer<TopTerritoryAnswerData>;
  primaryAudience?: QuestionAnswer<PrimaryAudienceAnswerData>;
  fastestGrowingSegment?: QuestionAnswer<FastestGrowingSegmentAnswerData>;
  underservedSegment?: QuestionAnswer<UnderservedSegmentAnswerData>;
  territoryGrowthOpportunity?: QuestionAnswer<TerritoryGrowthOpportunityAnswerData>;
  audienceContentMismatch?: QuestionAnswer<AudienceContentMismatchAnswerData>;
  growthTheme?: QuestionAnswer<GrowthThemeAnswerData>;
  engagementFormat?: QuestionAnswer<EngagementFormatAnswerData>;
  audienceAcquisitionContent?: QuestionAnswer<AudienceAcquisitionContentAnswerData>;
  retentionContent?: QuestionAnswer<RetentionContentAnswerData>;
  /** Sprint 20.5, ADR-010: mesma ideia de `fastestGrowingSegment`, mas para a campanha mais eficiente por custo/seguidor. */
  lowestCostPerFollower?: QuestionAnswer<LowestCostPerFollowerAnswerData>;
}

/**
 * Uma regra da Decision Engine: isolada (um arquivo, uma responsabilidade),
 * testável (`evaluate` é uma função pura) e reutilizável — mesmo contrato
 * de design já usado por `Rule` (Insights) e `Question` (Questions).
 */
export interface DecisionRule {
  id: string;
  description: string;
  evaluate(context: DecisionContext): Decision[];
}
