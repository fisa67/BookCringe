import { describe, expect, it } from "vitest";
import { staleDatasetQuestion } from "@/lib/intelligence/questions/staleDataset";
import type { IntelligenceDatasetRecord, IntelligenceImportRecord } from "@/lib/types/intelligence";

const NOW = new Date("2026-08-01T00:00:00.000Z");

function dataset(overrides: Partial<IntelligenceDatasetRecord>): IntelligenceDatasetRecord {
  return {
    id: "dataset-1",
    platform: "youtube",
    name: "YouTube Studio — Desempenho de vídeos",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function importRow(overrides: Partial<IntelligenceImportRecord>): IntelligenceImportRecord {
  return {
    id: "import-1",
    dataset_id: "dataset-1",
    status: "completed",
    file_name: "relatorio.csv",
    accepted_records: 1,
    rejected_records: 0,
    started_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("staleDatasetQuestion", () => {
  it("expõe o id e a pergunta em linguagem natural", () => {
    expect(staleDatasetQuestion.id).toBe("stale-dataset");
    expect(staleDatasetQuestion.question).toBe("Qual é o Dataset mais desatualizado?");
  });

  it("não tem resposta quando não há nenhum Dataset", () => {
    const result = staleDatasetQuestion.answer({ now: NOW, datasets: [], imports: [] });

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
    expect(result.summary).toMatch(/nenhum dataset/i);
  });

  it("não tem resposta quando o Dataset existe mas não tem nenhum Import", () => {
    const result = staleDatasetQuestion.answer({ now: NOW, datasets: [dataset({})], imports: [] });

    expect(result.hasAnswer).toBe(false);
    expect(result.data).toBeNull();
  });

  it("calcula os dias desde o Import mais recente do Dataset", () => {
    const result = staleDatasetQuestion.answer({
      now: NOW,
      datasets: [dataset({})],
      imports: [importRow({ started_at: "2026-06-01T00:00:00.000Z" })],
    });

    expect(result.hasAnswer).toBe(true);
    expect(result.data).toMatchObject({ datasetId: "dataset-1", daysSinceLastImport: 61 });
  });

  it("considera só o Import mais recente do Dataset (ignora imports antigos)", () => {
    const result = staleDatasetQuestion.answer({
      now: NOW,
      datasets: [dataset({})],
      imports: [
        importRow({ id: "import-1", started_at: "2026-01-01T00:00:00.000Z" }),
        importRow({ id: "import-2", started_at: "2026-07-25T00:00:00.000Z" }),
      ],
    });

    expect(result.data).toMatchObject({ daysSinceLastImport: 7, lastImportAt: "2026-07-25T00:00:00.000Z" });
  });

  it("escolhe o Dataset mais desatualizado entre vários", () => {
    const freshDataset = dataset({ id: "dataset-2", platform: "instagram", name: "Instagram — Reels" });

    const result = staleDatasetQuestion.answer({
      now: NOW,
      datasets: [dataset({}), freshDataset],
      imports: [
        importRow({ dataset_id: "dataset-1", started_at: "2026-05-01T00:00:00.000Z" }),
        importRow({ id: "import-2", dataset_id: "dataset-2", started_at: "2026-07-28T00:00:00.000Z" }),
      ],
    });

    expect(result.data).toMatchObject({ datasetId: "dataset-1", platform: "youtube" });
  });

  it("monta um resumo em linguagem natural pronto para exibição", () => {
    const result = staleDatasetQuestion.answer({
      now: NOW,
      datasets: [dataset({})],
      imports: [importRow({ started_at: "2026-06-01T00:00:00.000Z" })],
    });

    expect(result.summary).toBe(
      `O Dataset mais desatualizado é "YouTube Studio — Desempenho de vídeos", sem uma nova importação há 61 dia(s).`
    );
  });
});
