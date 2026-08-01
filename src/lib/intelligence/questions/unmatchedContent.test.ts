import { describe, expect, it } from "vitest";
import { unmatchedContentQuestion } from "@/lib/intelligence/questions/unmatchedContent";
import type { IntelligenceContentRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function content(overrides: Partial<IntelligenceContentRecord>): IntelligenceContentRecord {
  return {
    id: "content-1",
    dataset_id: "dataset-1",
    title: "Como ler mais em 2026",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("unmatchedContentQuestion", () => {
  it("expõe o id e a pergunta em linguagem natural", () => {
    expect(unmatchedContentQuestion.id).toBe("unmatched-content");
    expect(unmatchedContentQuestion.question).toBe("Quanto do meu conteúdo ainda não foi vinculado a um Livro?");
  });

  it("não tem resposta quando não há nenhum Content", () => {
    const result = unmatchedContentQuestion.answer({ now: NOW, contents: [] });

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
    expect(result.summary).toMatch(/nenhum conteúdo/i);
  });

  it("calcula contagem e proporção de Contents sem Livro vinculado", () => {
    const contents = [
      content({ id: "content-1", book_id: "book-1" }),
      content({ id: "content-2" }),
      content({ id: "content-3" }),
    ];

    const result = unmatchedContentQuestion.answer({ now: NOW, contents });

    expect(result.hasAnswer).toBe(true);
    expect(result.data).toEqual({ totalContents: 3, unmatchedContents: 2, unmatchedRatio: 2 / 3 });
  });

  it("reporta zero não vinculados quando todos os Contents já têm Livro", () => {
    const contents = [content({ id: "content-1", book_id: "book-1" }), content({ id: "content-2", book_id: "book-2" })];

    const result = unmatchedContentQuestion.answer({ now: NOW, contents });

    expect(result.data).toEqual({ totalContents: 2, unmatchedContents: 0, unmatchedRatio: 0 });
  });

  it("monta um resumo em linguagem natural com a porcentagem arredondada", () => {
    const contents = [content({ id: "content-1" }), content({ id: "content-2" }), content({ id: "content-3" })];

    const result = unmatchedContentQuestion.answer({ now: NOW, contents });

    expect(result.summary).toBe("3 de 3 conteúdo(s) (100%) ainda não foram vinculados a um Livro.");
  });
});
