export type { Question, QuestionAnswer } from "@/lib/intelligence/questions/types";

export {
  BEST_CONTENT_METRIC_KEY,
  bestContentQuestion,
} from "@/lib/intelligence/questions/bestContent";
export type {
  BestContentAnswerData,
  BestContentQuestionContext,
} from "@/lib/intelligence/questions/bestContent";

export { staleDatasetQuestion } from "@/lib/intelligence/questions/staleDataset";
export type {
  StaleDatasetAnswerData,
  StaleDatasetQuestionContext,
} from "@/lib/intelligence/questions/staleDataset";

export { unmatchedContentQuestion } from "@/lib/intelligence/questions/unmatchedContent";
export type {
  UnmatchedContentAnswerData,
  UnmatchedContentQuestionContext,
} from "@/lib/intelligence/questions/unmatchedContent";

export {
  activityPeakQuestion,
  followerGrowthQuestion,
  primaryAudienceQuestion,
  topTerritoryQuestion,
} from "@/lib/intelligence/questions/audience";
export type {
  ActivityPeakAnswerData,
  AudienceQuestionContext,
  FollowerGrowthAnswerData,
  PrimaryAudienceAnswerData,
  TopTerritoryAnswerData,
} from "@/lib/intelligence/questions/audience";

export {
  audienceContentMismatchQuestion,
  fastestGrowingSegmentQuestion,
  territoryGrowthOpportunityQuestion,
  underservedSegmentQuestion,
} from "@/lib/intelligence/questions/audienceStrategy";
export type {
  AudienceContentMismatchAnswerData,
  AudienceStrategyQuestionContext,
  FastestGrowingSegmentAnswerData,
  TerritoryGrowthOpportunityAnswerData,
  UnderservedSegmentAnswerData,
} from "@/lib/intelligence/questions/audienceStrategy";

export {
  audienceAcquisitionContentQuestion,
  engagementFormatQuestion,
  growthThemeQuestion,
  retentionContentQuestion,
} from "@/lib/intelligence/questions/contentPerformance";
export type {
  AudienceAcquisitionContentAnswerData,
  ContentPerformanceQuestionContext,
  EngagementFormatAnswerData,
  GrowthThemeAnswerData,
  RetentionContentAnswerData,
} from "@/lib/intelligence/questions/contentPerformance";

export {
  bestCampaignQuestion,
  highestAcquisitionQuestion,
  lowestCostPerFollowerQuestion,
} from "@/lib/intelligence/questions/campaign";
export type {
  BestCampaignAnswerData,
  CampaignEvidenceConfidence,
  CampaignQuestionContext,
  HighestAcquisitionAnswerData,
  LowestCostPerFollowerAnswerData,
} from "@/lib/intelligence/questions/campaign";
