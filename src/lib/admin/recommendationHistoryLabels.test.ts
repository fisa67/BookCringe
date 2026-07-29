import { describe, expect, it } from "vitest";
import { computeDaysHighlighted, getRecommendationHistoryStatus } from "./recommendationHistoryLabels";

describe("computeDaysHighlighted", () => {
  it("calcula os dias entre started_at e ended_at para uma recomendação encerrada", () => {
    expect(computeDaysHighlighted("2026-07-20T12:00:00.000Z", "2026-07-27T12:00:00.000Z")).toBe(7);
  });

  it("usa `now` no lugar de ended_at para a recomendação atual (ended_at null)", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    expect(computeDaysHighlighted("2026-07-28T12:00:00.000Z", null, now)).toBe(2);
  });

  it("nunca devolve menos que 1 dia, mesmo encerrada no mesmo instante em que começou", () => {
    expect(computeDaysHighlighted("2026-07-20T12:00:00.000Z", "2026-07-20T12:00:00.000Z")).toBe(1);
  });

  it("arredonda para o inteiro mais próximo em diferenças que não são múltiplos exatos de 1 dia", () => {
    expect(computeDaysHighlighted("2026-07-20T00:00:00.000Z", "2026-07-20T10:00:00.000Z")).toBe(1);
    expect(computeDaysHighlighted("2026-07-20T00:00:00.000Z", "2026-07-21T18:00:00.000Z")).toBe(2);
  });
});

describe("getRecommendationHistoryStatus", () => {
  it("retorna \"active\" quando ended_at é null", () => {
    expect(getRecommendationHistoryStatus(null)).toBe("active");
  });

  it("retorna \"ended\" quando ended_at está preenchido", () => {
    expect(getRecommendationHistoryStatus("2026-07-27T12:00:00.000Z")).toBe("ended");
  });
});
