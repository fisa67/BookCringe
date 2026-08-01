import { describe, expect, it } from "vitest";
import { normalizeTitle, titleSimilarity } from "@/lib/intelligence/matching/similarity";

describe("normalizeTitle", () => {
  it("remove acentos, pontuação e normaliza espaços/caixa", () => {
    expect(normalizeTitle("Como Ler Mais em 2026!")).toBe("como ler mais em 2026");
    expect(normalizeTitle("  Título   com   Acentuação  ")).toBe("titulo com acentuacao");
  });
});

describe("titleSimilarity", () => {
  it("retorna 1 para títulos idênticos após normalização", () => {
    expect(titleSimilarity("Como ler mais em 2026", "como ler mais em 2026")).toBe(1);
    expect(titleSimilarity("O Hobbit", "o hobbit!")).toBe(1);
  });

  it("retorna um score alto para títulos muito parecidos", () => {
    const score = titleSimilarity("Como ler mais em 2026 | Resenha", "Como ler mais em 2026");
    expect(score).toBeGreaterThan(0.7);
  });

  it("retorna um score baixo para títulos sem relação", () => {
    const score = titleSimilarity("Como ler mais em 2026", "Receita de bolo de cenoura");
    expect(score).toBeLessThan(0.3);
  });

  it("retorna 0 quando um dos títulos é vazio", () => {
    expect(titleSimilarity("", "Como ler mais em 2026")).toBe(0);
    expect(titleSimilarity("   ", "Como ler mais em 2026")).toBe(0);
  });

  it("é simétrica (a, b) === (b, a)", () => {
    const a = "Livros que mudaram minha rotina";
    const b = "Livros que mudaram a minha rotina de leitura";
    expect(titleSimilarity(a, b)).toBe(titleSimilarity(b, a));
  });
});
