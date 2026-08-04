// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImportSession } from "@/components/admin/intelligence/useImportSession";
import type { ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import type { PersistenceReceipt } from "@/lib/intelligence/imports/types";

/**
 * Regressão: `confirmImport` já teve um bug em que a decisão de chamar a
 * Server Action dependia de uma variável (`shouldImport`) só preenchida
 * dentro do callback assíncrono de `setSession` — que o React executa de
 * forma diferida, depois que `confirmImport` já tinha retornado. Resultado:
 * a sessão mudava para `importing` e nunca saía dali, porque a Server Action
 * de confirmação nunca era chamada.
 *
 * Este teste renderiza o hook de verdade (React + jsdom reais) e mocka
 * apenas a Server Action (`@/app/admin/intelligence/importacoes/actions`) —
 * a mesma fronteira de I/O que o hook já depende de fora, sem tocar em
 * Adapter/Persistência (cobertos por `parser.test.ts`/`persistence.test.ts`).
 *
 * Desde a Sprint 14, `confirmImport` chama `confirmImportAction` (não mais
 * `importYouTubeDatasetAction` diretamente) — o dispatcher que decide, pela
 * plataforma, se grava no Dataset do YouTube ou no de audiência do
 * Instagram (`docs/intelligence/AUDIENCE_PERSISTENCE.md`).
 */

const { previewImportActionMock, confirmImportActionMock } = vi.hoisted(() => ({
  previewImportActionMock: vi.fn(),
  confirmImportActionMock: vi.fn(),
}));

vi.mock("@/app/admin/intelligence/importacoes/actions", () => ({
  previewImportAction: previewImportActionMock,
  confirmImportAction: confirmImportActionMock,
}));

// Habilita act() fora do React Testing Library (não usado neste projeto).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const READY_PREVIEW: ImportPreviewResult = {
  status: "ready",
  platform: "youtube",
  preview: {
    format: "csv",
    confidence: 0.95,
    videoCount: 2,
    period: { start: "2026-01-01", end: "2026-01-02" },
    metrics: [{ key: "views", label: "Visualizações", total: 100 }],
    issues: [],
  },
};

const PERSISTED_RECEIPT: PersistenceReceipt = {
  batchId: "batch-1",
  status: "persisted",
  acceptedRecords: 2,
  rejectedRecords: 0,
  issues: [],
};

type HookSnapshot = ReturnType<typeof useImportSession>;

// Caixa mutável (não reatribuída dentro do componente) para expor o
// resultado do hook ao código de teste, fora da árvore React.
const probe: { current: HookSnapshot | null } = { current: null };

function captureSnapshot(snapshot: HookSnapshot): void {
  probe.current = snapshot;
}

function HookProbe() {
  captureSnapshot(useImportSession());
  return null;
}

function flush(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function selectFileAndWaitForReady(): Promise<void> {
  const file = new File(["conteudo"], "youtube-studio-report.csv", { type: "text/csv" });

  await act(async () => {
    probe.current!.selectFile(file);
  });

  for (let i = 0; i < 20 && probe.current!.session.stage !== "ready"; i += 1) {
    await act(async () => {
      await flush(100);
    });
  }
}

describe("useImportSession.confirmImport", () => {
  let root: Root;

  beforeEach(async () => {
    previewImportActionMock.mockReset().mockResolvedValue(READY_PREVIEW);
    confirmImportActionMock.mockReset().mockResolvedValue(PERSISTED_RECEIPT);

    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    probe.current = null;

    await act(async () => {
      root.render(<HookProbe />);
    });
  });

  it("chama confirmImportAction e chega em 'imported' quando a sessão está 'ready' (regressão do bug em que shouldImport travava a sessão em 'importing')", async () => {
    await selectFileAndWaitForReady();
    expect(probe.current!.session.stage).toBe("ready");

    await act(async () => {
      probe.current!.confirmImport();
    });

    for (let i = 0; i < 20 && probe.current!.session.stage === "importing"; i += 1) {
      await act(async () => {
        await flush(50);
      });
    }

    expect(confirmImportActionMock).toHaveBeenCalledTimes(1);
    expect(probe.current!.session.stage).toBe("imported");
    expect(probe.current!.session.importResult).toEqual(PERSISTED_RECEIPT);
  });

  it("nunca chama confirmImportAction quando a sessão ainda não está 'ready'", async () => {
    // stage inicial é "idle" — nenhum arquivo foi selecionado ainda.
    await act(async () => {
      probe.current!.confirmImport();
    });

    expect(confirmImportActionMock).not.toHaveBeenCalled();
    expect(probe.current!.session.stage).toBe("idle");
  });

  it("transiciona para 'import_error' (não fica travada em 'importing') quando a Server Action retorna falha", async () => {
    confirmImportActionMock.mockResolvedValue({
      batchId: "batch-1",
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 1,
      issues: [{ stage: "persist", message: "Falha simulada." }],
    } satisfies PersistenceReceipt);

    await selectFileAndWaitForReady();

    await act(async () => {
      probe.current!.confirmImport();
    });

    for (let i = 0; i < 20 && probe.current!.session.stage === "importing"; i += 1) {
      await act(async () => {
        await flush(50);
      });
    }

    expect(confirmImportActionMock).toHaveBeenCalledTimes(1);
    expect(probe.current!.session.stage).toBe("import_error");
  });
});

const INSTAGRAM_READY_PREVIEW: ImportPreviewResult = {
  status: "ready",
  platform: "instagram",
  preview: {
    format: "excel",
    confidence: 0.92,
    recordCount: 30,
    kinds: [{ kind: "audience_history", recordCount: 30, period: { start: "2025-12-17", end: "2026-01-15" } }],
    metrics: [{ key: "followersLatest", label: "Seguidores (mais recente)", total: 4498 }],
    records: [],
    issues: [],
  },
};

const INSTAGRAM_PERSISTED_RECEIPT: PersistenceReceipt = {
  batchId: "batch-instagram-1",
  status: "persisted",
  acceptedRecords: 30,
  rejectedRecords: 0,
  issues: [],
};

/**
 * Evidência de ponta a ponta da Sprint 14 ("Instagram Persistence",
 * `docs/intelligence/AUDIENCE_PERSISTENCE.md`): seleção do arquivo →
 * Detection Preview → Preview → Validação → Importar, tudo de verdade para
 * um `.xlsx` de audiência do Instagram (usando o `previewImportAction` real
 * de produção; só a Server Action de confirmação é mockada) — a sessão
 * agora chega em `ready`, porque a checagem "persistence"
 * (`session/validation.ts`) já reconhece o Instagram
 * (`imports/platformCapabilities.ts`), e `confirmImport` chama
 * `confirmImportAction` como qualquer outra plataforma com persistência.
 */
describe("useImportSession — Instagram (Sprint 14, com persistência)", () => {
  let root: Root;

  beforeEach(async () => {
    previewImportActionMock.mockReset().mockResolvedValue(INSTAGRAM_READY_PREVIEW);
    confirmImportActionMock.mockReset().mockResolvedValue(INSTAGRAM_PERSISTED_RECEIPT);

    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    probe.current = null;

    await act(async () => {
      root.render(<HookProbe />);
    });
  });

  it("reconhece o FollowerHistory.xlsx, monta a Preview/Validação, chega em 'ready' e confirma o Importar até 'imported'", async () => {
    const file = new File(["conteudo binário simulado"], "FollowerHistory.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await act(async () => {
      probe.current!.selectFile(file);
    });

    for (let i = 0; i < 20 && probe.current!.session.stage === "detecting"; i += 1) {
      await act(async () => {
        await flush(50);
      });
    }
    for (let i = 0; i < 20 && probe.current!.session.stage === "validating"; i += 1) {
      await act(async () => {
        await flush(100);
      });
    }

    expect(previewImportActionMock).toHaveBeenCalledTimes(1);

    // Detection Preview + Preview chegaram de verdade (herdado da Sprint 13).
    expect(probe.current!.session.preview).toEqual(INSTAGRAM_READY_PREVIEW);
    expect(probe.current!.session.summary).toEqual({
      platform: "instagram",
      confidence: 0.92,
      period: { start: "2025-12-17", end: "2026-01-15" },
      recordCount: 30,
      metrics: [{ key: "followersLatest", label: "Seguidores (mais recente)", total: 4498 }],
    });

    // Item 6 do escopo da Sprint 14: o bloqueio de "persistence" foi removido.
    expect(probe.current!.session.stage).toBe("ready");
    expect(probe.current!.session.validation?.isValid).toBe(true);
    const persistenceCheck = probe.current!.session.validation?.checks.find((check) => check.key === "persistence");
    expect(persistenceCheck?.passed).toBe(true);

    // Item 5 do escopo: confirmar o Importar chama a Server Action e chega em "imported".
    await act(async () => {
      probe.current!.confirmImport();
    });

    for (let i = 0; i < 20 && probe.current!.session.stage === "importing"; i += 1) {
      await act(async () => {
        await flush(50);
      });
    }

    expect(confirmImportActionMock).toHaveBeenCalledTimes(1);
    expect(probe.current!.session.stage).toBe("imported");
    expect(probe.current!.session.importResult).toEqual(INSTAGRAM_PERSISTED_RECEIPT);
  });
});
