import { describe, expect, it } from "vitest";
import { buildChatPrompt } from "@/lib/intelligence/chat/prompt";
import type { IntelligenceChatContextItem } from "@/lib/intelligence/chat/types";

describe("buildChatPrompt", () => {
  it("inclui a pergunta e cada item de contexto formatado com seu tipo", () => {
    const items: IntelligenceChatContextItem[] = [
      { id: "question:best-content", kind: "question", title: "Melhor conteúdo?", text: "O vídeo X." },
      { id: "decision:d1", kind: "decision", title: "Repita o tema", text: "Ação recomendada: publique mais." },
    ];

    const prompt = buildChatPrompt("Qual o melhor conteúdo?", items);

    expect(prompt.system).toMatch(/português do Brasil/i);
    expect(prompt.system).toMatch(/nunca invente/i);
    expect(prompt.user).toContain('Qual o melhor conteúdo?');
    expect(prompt.user).toContain("[Pergunta respondida] Melhor conteúdo?: O vídeo X.");
    expect(prompt.user).toContain("[Decisão recomendada] Repita o tema: Ação recomendada: publique mais.");
  });

  it("avisa explicitamente quando não há contexto relevante, em vez de inventar dado", () => {
    const prompt = buildChatPrompt("Pergunta qualquer", []);

    expect(prompt.user).toContain("Nenhuma informação relevante foi encontrada");
  });
});
