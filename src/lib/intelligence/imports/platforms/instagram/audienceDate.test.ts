import { describe, expect, it } from "vitest";
import { parsePtBrDayMonth, resolveYearForSequentialDates } from "@/lib/intelligence/imports/platforms/instagram/audienceDate";

describe("parsePtBrDayMonth", () => {
  it("reconhece o formato '<dia> de <mês>' em pt-BR", () => {
    expect(parsePtBrDayMonth("31 de julho")).toEqual({ day: 31, month: 7 });
    expect(parsePtBrDayMonth("1 de janeiro")).toEqual({ day: 1, month: 1 });
    expect(parsePtBrDayMonth("25 de dezembro")).toEqual({ day: 25, month: 12 });
  });

  it("é insensível a maiúsculas/minúsculas e a espaços nas pontas", () => {
    expect(parsePtBrDayMonth("  5 DE Agosto  ")).toEqual({ day: 5, month: 8 });
  });

  it("aceita 'março' com ou sem acento", () => {
    expect(parsePtBrDayMonth("10 de março")).toEqual({ day: 10, month: 3 });
    expect(parsePtBrDayMonth("10 de marco")).toEqual({ day: 10, month: 3 });
  });

  it("retorna null para valores fora do padrão", () => {
    expect(parsePtBrDayMonth("2026-07-31")).toBeNull();
    expect(parsePtBrDayMonth("31 julho")).toBeNull();
    expect(parsePtBrDayMonth("32 de julho")).toBeNull();
    expect(parsePtBrDayMonth("31 de julho de 2026")).toBeNull();
    expect(parsePtBrDayMonth("")).toBeNull();
  });
});

describe("resolveYearForSequentialDates", () => {
  it("retorna lista vazia para entradas vazias", () => {
    expect(resolveYearForSequentialDates([], new Date("2026-08-03"))).toEqual([]);
  });

  it("usa o ano da referência quando não há virada de ano na sequência", () => {
    const entries = [
      { day: 25, month: 7 },
      { day: 26, month: 7 },
      { day: 30, month: 7 },
    ];

    expect(resolveYearForSequentialDates(entries, new Date("2026-08-03"))).toEqual([
      "2026-07-25",
      "2026-07-26",
      "2026-07-30",
    ]);
  });

  it("recua um ano na última entrada quando ela ainda seria 'no futuro' em relação à referência", () => {
    // Referência é 3 de agosto; a última entrada é 5 de agosto — ainda não
    // pode ser deste ano, então toda a sequência é do ano anterior.
    const entries = [
      { day: 1, month: 8 },
      { day: 5, month: 8 },
    ];

    expect(resolveYearForSequentialDates(entries, new Date("2026-08-03"))).toEqual(["2025-08-01", "2025-08-05"]);
  });

  it("decrementa o ano ao cruzar uma virada dezembro → janeiro, andando de trás para frente", () => {
    const entries = [
      { day: 17, month: 12 }, // dez/2025
      { day: 31, month: 12 }, // dez/2025
      { day: 1, month: 1 }, // jan/2026
      { day: 15, month: 1 }, // jan/2026
    ];

    expect(resolveYearForSequentialDates(entries, new Date("2026-01-20"))).toEqual([
      "2025-12-17",
      "2025-12-31",
      "2026-01-01",
      "2026-01-15",
    ]);
  });

  it("lida com uma sequência que cobre quase um ano inteiro (só 1 virada)", () => {
    const entries = [
      { day: 1, month: 1 },
      { day: 15, month: 6 },
      { day: 31, month: 12 },
      { day: 1, month: 1 },
      { day: 10, month: 1 },
    ];

    expect(resolveYearForSequentialDates(entries, new Date("2026-02-01"))).toEqual([
      "2025-01-01",
      "2025-06-15",
      "2025-12-31",
      "2026-01-01",
      "2026-01-10",
    ]);
  });
});
