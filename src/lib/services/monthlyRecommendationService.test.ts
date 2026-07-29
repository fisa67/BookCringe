import { describe, expect, it } from "vitest";
import { getRecommendationHistorySyncAction } from "./monthlyRecommendationService";

/**
 * Cobre só a decisão pura de `syncRecommendationHistory` — as funções que
 * tocam o Supabase (`getRecommendationHistory`, `closeActiveRecommendation`,
 * `startRecommendation`) ficam para uma futura suíte de integração, mesmo
 * critério de `subscriberService.test.ts`.
 */
describe("getRecommendationHistorySyncAction", () => {
  it('"close-and-start" quando o livro vira a recomendação atual (inativo → ativo)', () => {
    expect(getRecommendationHistorySyncAction(false, true)).toBe("close-and-start");
  });

  it('"close" quando o admin desmarca o destaque sem outro livro assumir (ativo → inativo)', () => {
    expect(getRecommendationHistorySyncAction(true, false)).toBe("close");
  });

  it('"none" quando o livro já era a recomendação atual e continua sendo (sem mudança real)', () => {
    expect(getRecommendationHistorySyncAction(true, true)).toBe("none");
  });

  it('"none" quando o livro já não era a recomendação e continua não sendo', () => {
    expect(getRecommendationHistorySyncAction(false, false)).toBe("none");
  });
});
