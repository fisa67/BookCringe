export { normalizeTitle, titleSimilarity } from "@/lib/intelligence/matching/similarity";

export {
  findBookMatchCandidates,
  suggestBookMatch,
  MATCH_SUGGESTION_THRESHOLD,
} from "@/lib/intelligence/matching/suggest";

export type { BookMatchCandidate, MatchableBook } from "@/lib/intelligence/matching/suggest";
