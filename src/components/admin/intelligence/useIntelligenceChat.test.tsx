// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIntelligenceChat } from "@/components/admin/intelligence/useIntelligenceChat";
import type { IntelligenceChatResult } from "@/lib/intelligence/chat/types";

const { askIntelligenceChatActionMock } = vi.hoisted(() => ({
  askIntelligenceChatActionMock: vi.fn(),
}));

vi.mock("@/app/admin/intelligence/chat/actions", () => ({
  askIntelligenceChatAction: askIntelligenceChatActionMock,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type HookSnapshot = ReturnType<typeof useIntelligenceChat>;

// Caixa mutável (não reatribuída dentro do componente) para expor o
// resultado do hook ao código de teste, fora da árvore React — mesmo padrão
// de `useImportSession.test.tsx`.
const probe: { current: HookSnapshot | null } = { current: null };

function captureSnapshot(snapshot: HookSnapshot): void {
  probe.current = snapshot;
}

function HookProbe() {
  captureSnapshot(useIntelligenceChat());
  return null;
}

function flush(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("useIntelligenceChat", () => {
  let root: Root;

  beforeEach(async () => {
    askIntelligenceChatActionMock.mockReset();

    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    probe.current = null;

    await act(async () => {
      root.render(<HookProbe />);
    });
  });

  it("adiciona a mensagem do usuário e a resposta do assistente ao concluir", async () => {
    const okResult: IntelligenceChatResult = { status: "ok", reply: "O vídeo X foi o destaque.", usedContext: [] };
    askIntelligenceChatActionMock.mockResolvedValue(okResult);

    await act(async () => {
      probe.current!.sendQuestion("Qual foi o melhor conteúdo?");
      await flush(0);
    });

    expect(probe.current!.messages).toEqual([
      { role: "user", content: "Qual foi o melhor conteúdo?" },
      { role: "assistant", content: "O vídeo X foi o destaque." },
    ]);
    expect(probe.current!.isSending).toBe(false);
    expect(probe.current!.errorMessage).toBeNull();
  });

  it("guarda a mensagem de erro amigável sem adicionar uma resposta do assistente", async () => {
    askIntelligenceChatActionMock.mockResolvedValue({ status: "error", message: "Chat não configurado." });

    await act(async () => {
      probe.current!.sendQuestion("Qualquer pergunta");
      await flush(0);
    });

    expect(probe.current!.messages).toEqual([{ role: "user", content: "Qualquer pergunta" }]);
    expect(probe.current!.errorMessage).toBe("Chat não configurado.");
    expect(probe.current!.isSending).toBe(false);
  });

  it("ignora perguntas em branco, sem chamar a Server Action", async () => {
    await act(async () => {
      probe.current!.sendQuestion("   ");
    });

    expect(askIntelligenceChatActionMock).not.toHaveBeenCalled();
    expect(probe.current!.messages).toEqual([]);
  });

  it("reset() limpa mensagens e erro", async () => {
    askIntelligenceChatActionMock.mockResolvedValue({ status: "error", message: "erro" });

    await act(async () => {
      probe.current!.sendQuestion("pergunta");
      await flush(0);
    });
    expect(probe.current!.messages).toHaveLength(1);

    await act(async () => {
      probe.current!.reset();
    });

    expect(probe.current!.messages).toEqual([]);
    expect(probe.current!.errorMessage).toBeNull();
  });
});
