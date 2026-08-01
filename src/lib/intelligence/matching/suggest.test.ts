import { describe, expect, it } from "vitest";
import { findBookMatchCandidates, suggestBookMatch } from "@/lib/intelligence/matching/suggest";

const BOOKS = [
  { id: "book-1", title: "Como Ler Mais em 2026" },
  { id: "book-2", title: "Livros que Mudaram Minha Rotina" },
  { id: "book-3", title: "O Hobbit" },
];

describe("findBookMatchCandidates", () => {
  it("sugere o Livro certo mesmo com sufixo extra no título do vídeo", () => {
    const candidates = findBookMatchCandidates({ contentTitle: "Como ler mais em 2026 | Resenha", books: BOOKS });

    expect(candidates[0]?.bookId).toBe("book-1");
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(0.6);
  });

  it("não sugere nada quando nenhum título é parecido o suficiente", () => {
    const candidates = findBookMatchCandidates({ contentTitle: "Receita de bolo de cenoura", books: BOOKS });

    expect(candidates).toEqual([]);
  });

  it("ordena candidatos do mais parecido para o menos parecido", () => {
    const candidates = findBookMatchCandidates({
      contentTitle: "Livros que mudaram minha rotina de leitura",
      books: BOOKS,
    });

    expect(candidates[0]?.bookId).toBe("book-2");
    expect(candidates).toEqual([...candidates].sort((a, b) => b.score - a.score));
  });

  it("respeita o `limit`", () => {
    const candidates = findBookMatchCandidates({ contentTitle: "Como ler mais em 2026", books: BOOKS, limit: 1 });
    expect(candidates).toHaveLength(1);
  });

  it("retorna lista vazia quando não há livros cadastrados", () => {
    expect(findBookMatchCandidates({ contentTitle: "Como ler mais em 2026", books: [] })).toEqual([]);
  });
});

describe("suggestBookMatch", () => {
  it("retorna só a melhor sugestão", () => {
    const match = suggestBookMatch({ contentTitle: "Como ler mais em 2026 | Resenha", books: BOOKS });
    expect(match).toEqual({ bookId: "book-1", bookTitle: "Como Ler Mais em 2026", score: expect.any(Number) });
  });

  it("retorna null quando não há candidato acima do threshold", () => {
    expect(suggestBookMatch({ contentTitle: "Receita de bolo de cenoura", books: BOOKS })).toBeNull();
  });
});
