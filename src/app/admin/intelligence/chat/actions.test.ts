import { describe, expect, it, vi, beforeEach } from "vitest";
import { askIntelligenceChatAction } from "./actions";

const { askIntelligenceChatMock } = vi.hoisted(() => ({
  askIntelligenceChatMock: vi.fn(),
}));

vi.mock("@/lib/services/intelligenceChatService", () => ({
  askIntelligenceChat: askIntelligenceChatMock,
}));

describe("askIntelligenceChatAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("repassa a pergunta do FormData para o service e devolve o resultado", async () => {
    askIntelligenceChatMock.mockResolvedValue({ status: "ok", reply: "Resposta", usedContext: [] });

    const formData = new FormData();
    formData.set("question", "Qual foi o melhor conteúdo?");

    const result = await askIntelligenceChatAction(formData);

    expect(askIntelligenceChatMock).toHaveBeenCalledWith("Qual foi o melhor conteúdo?");
    expect(result).toEqual({ status: "ok", reply: "Resposta", usedContext: [] });
  });

  it("retorna erro amigável, sem chamar o service, quando não há campo 'question' válido", async () => {
    const formData = new FormData();

    const result = await askIntelligenceChatAction(formData);

    expect(askIntelligenceChatMock).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: expect.stringContaining("Digite uma pergunta") });
  });
});
