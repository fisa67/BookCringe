import { describe, expect, it, vi } from "vitest";
import { getIntelligenceChatModel } from "@/lib/intelligence/chat/provider";
import { getIntelligenceChatEnv } from "@/lib/env";

const { createOpenAICompatibleMock, chatModelFactoryMock } = vi.hoisted(() => {
  const chatModelFactoryMock = vi.fn(() => ({ modelId: "mock-model" }));
  return {
    createOpenAICompatibleMock: vi.fn(() => chatModelFactoryMock),
    chatModelFactoryMock,
  };
});

vi.mock("@/lib/env", () => ({
  getIntelligenceChatEnv: vi.fn(),
}));

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: createOpenAICompatibleMock,
}));

const getIntelligenceChatEnvMock = vi.mocked(getIntelligenceChatEnv);

describe("getIntelligenceChatModel", () => {
  it("retorna null (sem lançar) quando a configuração não existe", () => {
    getIntelligenceChatEnvMock.mockReturnValue(null);

    expect(getIntelligenceChatModel()).toBeNull();
    expect(createOpenAICompatibleMock).not.toHaveBeenCalled();
  });

  it("cria o provedor OpenAI-compatible com as variáveis configuradas, nunca acoplando a um provedor específico", () => {
    getIntelligenceChatEnvMock.mockReturnValue({
      INTELLIGENCE_CHAT_API_KEY: "key-123",
      INTELLIGENCE_CHAT_BASE_URL: "https://api.example.com/v1",
      INTELLIGENCE_CHAT_MODEL: "some-model",
    });

    const model = getIntelligenceChatModel();

    expect(createOpenAICompatibleMock).toHaveBeenCalledWith({
      name: "intelligence-chat",
      apiKey: "key-123",
      baseURL: "https://api.example.com/v1",
    });
    expect(chatModelFactoryMock).toHaveBeenCalledWith("some-model");
    expect(model).toEqual({ modelId: "mock-model" });
  });
});
