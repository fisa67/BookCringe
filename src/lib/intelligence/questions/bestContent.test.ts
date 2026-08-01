import { describe, expect, it } from "vitest";
import { bestContentQuestion } from "@/lib/intelligence/questions/bestContent";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";

const NOW = new Date("2026-08-01T00:00:00.000Z");

const DATASET: IntelligenceDatasetRecord = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

function content(overrides: Partial<IntelligenceContentRecord>): IntelligenceContentRecord {
  return {
    id: "content-1",
    dataset_id: DATASET.id,
    title: "Como ler mais em 2026",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function metric(overrides: Partial<IntelligenceMetricRecord>): IntelligenceMetricRecord {
  return {
    id: "metric-1",
    dataset_id: DATASET.id,
    import_id: "import-1",
    key: "views",
    value: 0,
    measured_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const BOOK: CmsBookRecord = {
  id: "book-1",
  slug: "como-ler-mais",
  title: "Como Ler Mais em 2026",
  author: "Autor Exemplo",
  genres: [],
  metadata: {},
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

describe("bestContentQuestion", () => {
  it("expõe o id e a pergunta em linguagem natural", () => {
    expect(bestContentQuestion.id).toBe("best-content");
    expect(bestContentQuestion.question).toBe("Qual foi meu melhor conteúdo?");
  });

  it("não tem resposta quando não há nenhum Content", () => {
    const result = bestContentQuestion.answer({ now: NOW, datasets: [], contents: [], metrics: [], books: [] });

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
    expect(result.summary).toMatch(/não há conteúdo/i);
  });

  it("não tem resposta quando existem Contents mas nenhum tem a métrica 'views'", () => {
    const contents = [content({ id: "content-1" })];
    const metrics = [metric({ content_id: "content-1", key: "watch_time_hours", value: 40 })];

    const result = bestContentQuestion.answer({ now: NOW, datasets: [DATASET], contents, metrics, books: [] });

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
  });

  it("escolhe o Content com mais views, usando a leitura mais recente por Content", () => {
    const contents = [
      content({ id: "content-1", title: "Vídeo A" }),
      content({ id: "content-2", title: "Vídeo B" }),
    ];

    const metrics = [
      metric({ content_id: "content-1", key: "views", value: 100, measured_at: "2026-07-01T00:00:00.000Z" }),
      metric({ content_id: "content-1", key: "views", value: 500, measured_at: "2026-08-01T00:00:00.000Z" }),
      metric({ content_id: "content-2", key: "views", value: 300, measured_at: "2026-08-01T00:00:00.000Z" }),
    ];

    const result = bestContentQuestion.answer({ now: NOW, datasets: [DATASET], contents, metrics, books: [] });

    expect(result.hasAnswer).toBe(true);
    expect(result.data).toMatchObject({ contentId: "content-1", title: "Vídeo A", value: 500, metric: "views" });
  });

  it("inclui plataforma, dataset e livro vinculado quando existirem", () => {
    const contents = [content({ id: "content-1", title: "Vídeo A", book_id: "book-1", published_at: "2026-01-02" })];
    const metrics = [metric({ content_id: "content-1", key: "views", value: 15420 })];

    const result = bestContentQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      contents,
      metrics,
      books: [BOOK],
    });

    expect(result.data).toMatchObject({
      platform: "youtube",
      datasetName: DATASET.name,
      bookTitle: BOOK.title,
      publishedAt: "2026-01-02",
    });
  });

  it("não inclui bookTitle quando o Content não está vinculado a nenhum Livro", () => {
    const contents = [content({ id: "content-1" })];
    const metrics = [metric({ content_id: "content-1", key: "views", value: 10 })];

    const result = bestContentQuestion.answer({ now: NOW, datasets: [DATASET], contents, metrics, books: [BOOK] });

    expect(result.data?.bookTitle).toBeUndefined();
  });

  it("usa 'Dataset removido' quando o Dataset do Content não existe mais na lista", () => {
    const contents = [content({ id: "content-1", dataset_id: "dataset-inexistente" })];
    const metrics = [metric({ content_id: "content-1", dataset_id: "dataset-inexistente", key: "views", value: 10 })];

    const result = bestContentQuestion.answer({ now: NOW, datasets: [], contents, metrics, books: [] });

    expect(result.data).toMatchObject({ platform: "unknown", datasetName: "Dataset removido" });
  });

  it("preenche questionId, question e answeredAt a partir de `now`", () => {
    const contents = [content({ id: "content-1" })];
    const metrics = [metric({ content_id: "content-1", key: "views", value: 10 })];

    const result = bestContentQuestion.answer({ now: NOW, datasets: [DATASET], contents, metrics, books: [] });

    expect(result.questionId).toBe("best-content");
    expect(result.question).toBe("Qual foi meu melhor conteúdo?");
    expect(result.answeredAt).toBe(NOW.toISOString());
  });

  it("monta um resumo em linguagem natural pronto para exibição", () => {
    const contents = [content({ id: "content-1", title: "Vídeo A", book_id: "book-1" })];
    const metrics = [metric({ content_id: "content-1", key: "views", value: 15420 })];

    const result = bestContentQuestion.answer({
      now: NOW,
      datasets: [DATASET],
      contents,
      metrics,
      books: [BOOK],
    });

    expect(result.summary).toBe(
      `Seu melhor conteúdo foi "Vídeo A" (YouTube), sobre o livro "Como Ler Mais em 2026", com 15.420 de views.`
    );
  });
});
