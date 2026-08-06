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

const OWNER_ID = "filipe-santos";
const OTHER_OWNER_ID = "outro-criador";

const DATASET_ROW = {
  id: "dataset-1",
  owner_id: OWNER_ID,
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
  it("retorna o Dataset quando ele existe para o dono informado", async () => {
    const eqPlatformMock = vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
    }));
    const eqOwnerMock = vi.fn(() => ({ eq: eqPlatformMock }));
    fromMock.mockReturnValue({ select: vi.fn(() => ({ eq: eqOwnerMock })) });

    await expect(findDatasetByPlatform(OWNER_ID, "youtube")).resolves.toEqual(DATASET_ROW);
    expect(eqOwnerMock).toHaveBeenCalledWith("owner_id", OWNER_ID);
    expect(eqPlatformMock).toHaveBeenCalledWith("platform", "youtube");
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }),
          })),
        })),
      })),
    });

    await expect(findDatasetByPlatform(OWNER_ID, "youtube")).resolves.toBeNull();
  });
});

describe("createDataset", () => {
  it("insere o Dataset com o owner_id do criador e retorna o Dataset criado", async () => {
    const insertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
      })),
    }));
    fromMock.mockReturnValue({ insert: insertMock });

    await expect(
      createDataset(OWNER_ID, { platform: "youtube", name: "YouTube Studio — Desempenho de vídeos" })
    ).resolves.toEqual(DATASET_ROW);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: OWNER_ID, platform: "youtube" })
    );
  });
});

describe("findOrCreateDataset", () => {
  it("não cria um novo Dataset quando já existe um para o dono e a Platform", async () => {
    const insertMock = vi.fn();
    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }),
            })),
          })),
        })),
      })
      .mockReturnValueOnce({ insert: insertMock });

    const result = await findOrCreateDataset(OWNER_ID, {
      platform: "youtube",
      name: "YouTube Studio — Desempenho de vídeos",
    });

    expect(result).toEqual(DATASET_ROW);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("cria o Dataset para o dono quando ainda não existe um para a Platform", async () => {
    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
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
      findOrCreateDataset(OWNER_ID, { platform: "youtube", name: "YouTube Studio — Desempenho de vídeos" })
    ).resolves.toEqual(DATASET_ROW);
  });

  it("dois donos diferentes recebem Datasets distintos para a mesma Platform (isolamento multi-tenant)", async () => {
    const otherDatasetRow = { ...DATASET_ROW, id: "dataset-2", owner_id: OTHER_OWNER_ID };

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })
      .mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: otherDatasetRow, error: null }),
          })),
        })),
      });

    const result = await findOrCreateDataset(OTHER_OWNER_ID, {
      platform: "youtube",
      name: "YouTube Studio — Desempenho de vídeos",
    });

    expect(result?.owner_id).toBe(OTHER_OWNER_ID);
    expect(result?.id).not.toBe(DATASET_ROW.id);
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
  it("retorna só os Datasets do dono informado, ordenados por nome", async () => {
    const eqMock = vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [DATASET_ROW], error: null }) }));
    fromMock.mockReturnValue({ select: vi.fn(() => ({ eq: eqMock })) });

    await expect(listDatasets(OWNER_ID)).resolves.toEqual([DATASET_ROW]);
    expect(eqMock).toHaveBeenCalledWith("owner_id", OWNER_ID);
  });

  it("retorna null em caso de erro", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }) })),
      })),
    });

    await expect(listDatasets(OWNER_ID)).resolves.toBeNull();
  });
});

describe("listImports", () => {
  it("filtra pelos dataset_id dos Datasets do dono antes de buscar os Imports", async () => {
    const importRow = { id: "import-1", dataset_id: "dataset-1", started_at: "2026-08-01T00:00:00.000Z" };
    const inMock = vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [importRow], error: null }) }));

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [DATASET_ROW], error: null }) })),
        })),
      })
      .mockReturnValueOnce({ select: vi.fn(() => ({ in: inMock })) });

    await expect(listImports(OWNER_ID)).resolves.toEqual([importRow]);
    expect(inMock).toHaveBeenCalledWith("dataset_id", ["dataset-1"]);
  });

  it("retorna lista vazia sem consultar Imports quando o dono não tem nenhum Dataset", async () => {
    fromMock.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
      })),
    });

    await expect(listImports(OWNER_ID)).resolves.toEqual([]);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("retorna null quando a resolução dos Datasets do dono falha", async () => {
    fromMock.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }) })),
      })),
    });

    await expect(listImports(OWNER_ID)).resolves.toBeNull();
  });
});

describe("listMetrics", () => {
  it("filtra pelos dataset_id dos Datasets do dono antes de buscar as Metrics", async () => {
    const metricRow = { id: "metric-1", dataset_id: "dataset-1", import_id: "import-1", key: "views", value: 100 };
    const inMock = vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [metricRow], error: null }) }));

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [DATASET_ROW], error: null }) })),
        })),
      })
      .mockReturnValueOnce({ select: vi.fn(() => ({ in: inMock })) });

    await expect(listMetrics(OWNER_ID)).resolves.toEqual([metricRow]);
    expect(inMock).toHaveBeenCalledWith("dataset_id", ["dataset-1"]);
  });
});

describe("listContents", () => {
  it("filtra pelos dataset_id dos Datasets do dono antes de buscar os Contents", async () => {
    const contentRow = { id: "content-1", dataset_id: "dataset-1", title: "Como ler mais em 2026" };
    const inMock = vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [contentRow], error: null }) }));

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [DATASET_ROW], error: null }) })),
        })),
      })
      .mockReturnValueOnce({ select: vi.fn(() => ({ in: inMock })) });

    await expect(listContents(OWNER_ID)).resolves.toEqual([contentRow]);
  });
});

describe("linkContentToBook", () => {
  it("grava só a referência (book_id) quando o Content pertence ao dono", async () => {
    const contentRow = { id: "content-1", dataset_id: "dataset-1", title: "Como ler mais em 2026", book_id: "book-1" };
    const updateEqMock = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contentRow, error: null }) })),
    }));

    fromMock
      // 1. resolve dataset_id do Content.
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { dataset_id: "dataset-1" }, error: null }) })),
        })),
      })
      // 2. confirma que o Dataset pertence ao dono.
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }) })),
          })),
        })),
      })
      // 3. update real.
      .mockReturnValueOnce({ update: vi.fn(() => ({ eq: updateEqMock })) });

    await expect(linkContentToBook(OWNER_ID, { contentId: "content-1", bookId: "book-1" })).resolves.toEqual(
      contentRow
    );
    expect(updateEqMock).toHaveBeenCalledWith("id", "content-1");
  });

  it("retorna null sem escrever quando o Content pertence a outro dono (defesa contra IDOR)", async () => {
    const updateMock = vi.fn();

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { dataset_id: "dataset-1" }, error: null }) })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
          })),
        })),
      })
      .mockReturnValueOnce({ update: updateMock });

    await expect(
      linkContentToBook(OTHER_OWNER_ID, { contentId: "content-1", bookId: "book-1" })
    ).resolves.toBeNull();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("retorna null quando o Content não existe", async () => {
    fromMock.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
      })),
    });

    await expect(
      linkContentToBook(OWNER_ID, { contentId: "content-inexistente", bookId: "book-1" })
    ).resolves.toBeNull();
  });
});

describe("unlinkContentFromBook", () => {
  it("limpa o book_id do Content quando ele pertence ao dono", async () => {
    const contentRow = { id: "content-1", dataset_id: "dataset-1", title: "Como ler mais em 2026", book_id: null };
    const updateEqMock = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: contentRow, error: null }) })),
    }));

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { dataset_id: "dataset-1" }, error: null }) })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: DATASET_ROW, error: null }) })),
          })),
        })),
      })
      .mockReturnValueOnce({ update: vi.fn(() => ({ eq: updateEqMock })) });

    await expect(unlinkContentFromBook(OWNER_ID, "content-1")).resolves.toEqual(contentRow);
  });

  it("retorna null sem escrever quando o Content pertence a outro dono (defesa contra IDOR)", async () => {
    const updateMock = vi.fn();

    fromMock
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { dataset_id: "dataset-1" }, error: null }) })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
          })),
        })),
      })
      .mockReturnValueOnce({ update: updateMock });

    await expect(unlinkContentFromBook(OTHER_OWNER_ID, "content-1")).resolves.toBeNull();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
