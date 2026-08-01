import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDataset,
  createImport,
  finalizeImport,
  findDatasetByPlatform,
  findOrCreateDataset,
  insertMetrics,
  linkContentToBook,
  listContents,
  listDatasets,
  listImports,
  listMetrics,
  unlinkContentFromBook,
  upsertContent,
} from "./intelligenceDatasetService";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabaseAdminClient: {
    from: fromMock,
  },
}));

const DATASET_ROW = {
  id: "dataset-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  description: undefined,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

beforeEach(() => {
  fromMock.mockReset();
});

describe("findDatasetByPlatform", () => {
  it("retorna o Dataset quando ele existe", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
        })),
      })),
    });

    await expect(findDatasetByPlatform("youtube")).resolves.toEqual(DATASET_ROW);
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }),
        })),
      })),
    });

    await expect(findDatasetByPlatform("youtube")).resolves.toBeNull();
  });
});

describe("createDataset", () => {
  it("insere e retorna o Dataset criado", async () => {
    const insertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
      })),
    }));
    fromMock.mockReturnValue({ insert: insertMock });

    await expect(
      createDataset({ platform: "youtube", name: "YouTube Studio — Desempenho de vídeos" })
    ).resolves.toEqual(DATASET_ROW);
  });
});

describe("findOrCreateDataset", () => {
  it("não cria um novo Dataset quando já existe um para a Platform", async () => {
    const insertMock = vi.fn();
    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
          })),
        })),
      })
      .mockReturnValueOnce({ insert: insertMock });

    const result = await findOrCreateDataset({ platform: "youtube", name: "YouTube Studio — Desempenho de vídeos" });

    expect(result).toEqual(DATASET_ROW);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("cria o Dataset quando ainda não existe um para a Platform", async () => {
    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })
      .mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
          })),
        })),
      });

    await expect(
      findOrCreateDataset({ platform: "youtube", name: "YouTube Studio — Desempenho de vídeos" })
    ).resolves.toEqual(DATASET_ROW);
  });
});

describe("createImport", () => {
  it("cria o Import com status inicial 'processing'", async () => {
    const importRow = {
      id: "import-1",
      dataset_id: "dataset-1",
      status: "processing",
      file_name: "youtube-julho.csv",
      accepted_records: 0,
      rejected_records: 0,
      started_at: "2026-08-01T00:00:00.000Z",
      finished_at: undefined,
    };
    const insertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: importRow, error: null }),
      })),
    }));
    fromMock.mockReturnValue({ insert: insertMock });

    await expect(createImport({ dataset_id: "dataset-1", file_name: "youtube-julho.csv" })).resolves.toEqual(
      importRow
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processing", dataset_id: "dataset-1", file_name: "youtube-julho.csv" })
    );
  });
});

describe("finalizeImport", () => {
  it("atualiza status, contadores e finished_at", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ update: updateMock });

    await expect(
      finalizeImport({ id: "import-1", status: "completed", acceptedRecords: 2, rejectedRecords: 0 })
    ).resolves.toBe(true);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", accepted_records: 2, rejected_records: 0 })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "import-1");
  });

  it("retorna false em caso de erro", async () => {
    fromMock.mockReturnValue({
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: new Error("boom") }) })),
    });

    await expect(
      finalizeImport({ id: "import-1", status: "failed", acceptedRecords: 0, rejectedRecords: 2 })
    ).resolves.toBe(false);
  });
});

describe("upsertContent", () => {
  it("faz upsert por (dataset_id, title) e retorna o Content", async () => {
    const contentRow = {
      id: "content-1",
      dataset_id: "dataset-1",
      title: "Como ler mais em 2026",
      published_at: "2026-01-02",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };
    const upsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: contentRow, error: null }),
      })),
    }));
    fromMock.mockReturnValue({ upsert: upsertMock });

    await expect(
      upsertContent({ dataset_id: "dataset-1", title: "Como ler mais em 2026", published_at: "2026-01-02" })
    ).resolves.toEqual(contentRow);

    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ dataset_id: "dataset-1" }), {
      onConflict: "dataset_id,title",
    });
  });
});

describe("insertMetrics", () => {
  it("não chama o Supabase quando não há linhas", async () => {
    await expect(insertMetrics([])).resolves.toBe(true);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("insere as linhas e retorna true em caso de sucesso", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });

    const rows = [
      {
        dataset_id: "dataset-1",
        import_id: "import-1",
        content_id: "content-1",
        key: "views",
        value: 15420,
        measured_at: "2026-08-01T00:00:00.000Z",
      },
    ];

    await expect(insertMetrics(rows)).resolves.toBe(true);
    expect(insertMock).toHaveBeenCalledWith(rows);
  });

  it("retorna false em caso de erro", async () => {
    fromMock.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: new Error("boom") }) });

    await expect(
      insertMetrics([
        {
          dataset_id: "dataset-1",
          import_id: "import-1",
          key: "views",
          value: 1,
          measured_at: "2026-08-01T00:00:00.000Z",
        },
      ])
    ).resolves.toBe(false);
  });
});

describe("listDatasets", () => {
  it("retorna os Datasets ordenados por nome", async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [DATASET_ROW], error: null });
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order: orderMock })) });

    await expect(listDatasets()).resolves.toEqual([DATASET_ROW]);
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }) })),
    });

    await expect(listDatasets()).resolves.toBeNull();
  });
});

describe("listImports", () => {
  it("retorna os Imports ordenados do mais recente para o mais antigo", async () => {
    const importRow = { id: "import-1", dataset_id: "dataset-1", started_at: "2026-08-01T00:00:00.000Z" };
    const orderMock = vi.fn().mockResolvedValue({ data: [importRow], error: null });
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order: orderMock })) });

    await expect(listImports()).resolves.toEqual([importRow]);
    expect(orderMock).toHaveBeenCalledWith("started_at", { ascending: false });
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }) })),
    });

    await expect(listImports()).resolves.toBeNull();
  });
});

describe("listMetrics", () => {
  it("retorna todas as Metrics", async () => {
    const metricRow = { id: "metric-1", dataset_id: "dataset-1", import_id: "import-1", key: "views", value: 100 };
    const orderMock = vi.fn().mockResolvedValue({ data: [metricRow], error: null });
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order: orderMock })) });

    await expect(listMetrics()).resolves.toEqual([metricRow]);
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }) })),
    });

    await expect(listMetrics()).resolves.toBeNull();
  });
});

describe("listContents", () => {
  it("retorna os Contents ordenados por título", async () => {
    const contentRow = { id: "content-1", dataset_id: "dataset-1", title: "Como ler mais em 2026" };
    const orderMock = vi.fn().mockResolvedValue({ data: [contentRow], error: null });
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order: orderMock })) });

    await expect(listContents()).resolves.toEqual([contentRow]);
  });
});

describe("linkContentToBook", () => {
  it("grava só a referência (book_id) e retorna o Content atualizado", async () => {
    const contentRow = { id: "content-1", dataset_id: "dataset-1", title: "Como ler mais em 2026", book_id: "book-1" };
    const eqMock = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contentRow, error: null }) })),
    }));
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ update: updateMock });

    await expect(linkContentToBook({ contentId: "content-1", bookId: "book-1" })).resolves.toEqual(contentRow);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ book_id: "book-1" }));
    expect(eqMock).toHaveBeenCalledWith("id", "content-1");
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }) })) })),
      })),
    });

    await expect(linkContentToBook({ contentId: "content-1", bookId: "book-1" })).resolves.toBeNull();
  });
});

describe("unlinkContentFromBook", () => {
  it("limpa o book_id do Content", async () => {
    const contentRow = { id: "content-1", dataset_id: "dataset-1", title: "Como ler mais em 2026", book_id: null };
    const eqMock = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contentRow, error: null }) })),
    }));
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ update: updateMock });

    await expect(unlinkContentFromBook("content-1")).resolves.toEqual(contentRow);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ book_id: null }));
  });
});
