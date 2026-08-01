import { describe, expect, it } from "vitest";
import { unmatchedContentRule } from "@/lib/intelligence/insights/rules/unmatchedContent";
import type { IntelligenceContentRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function content(id: string, bookId?: string): IntelligenceContentRecord {
  return {
    id,
    dataset_id: "dataset-1",
    title: `Vídeo ${id}`,
    book_id: bookId,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
}

describe("unmatchedContentRule", () => {
  it("não dispara quando não há nenhum Content", () => {
    expect(unmatchedContentRule.evaluate({ now: NOW, datasets: [], imports: [], contents: [], metrics: [] })).toEqual([]);
  });

  it("não dispara quando a maioria dos Contents já está vinculada", () => {
    const contents = [content("c1", "book-1"), content("c2", "book-2"), content("c3", "book-3"), content("c4")];

    const insights = unmatchedContentRule.evaluate({ now: NOW, datasets: [], imports: [], contents, metrics: [] });
    expect(insights).toEqual([]);
  });

  it("dispara quando pelo menos 30% dos Contents não têm Livro vinculado", () => {
    const contents = [content("c1", "book-1"), content("c2"), content("c3")];

    const insights = unmatchedContentRule.evaluate({ now: NOW, datasets: [], imports: [], contents, metrics: [] });

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: "unmatched-content",
      ruleId: "unmatched-content",
      severity: "info",
      title: "Conteúdos sem Livro",
    });
    expect(insights[0]?.message).toContain("2 de 3");
  });
});
