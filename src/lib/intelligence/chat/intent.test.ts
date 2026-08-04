import { describe, expect, it } from "vitest";
import { selectRelevantContext } from "@/lib/intelligence/chat/intent";
import type { IntelligenceChatContextItem } from "@/lib/intelligence/chat/types";

const ITEMS: IntelligenceChatContextItem[] = [
  {
    id: "question:best-content",
    kind: "question",
    title: "Qual foi o conteúdo com melhor desempenho?",
    text: "O vídeo 'Como ler mais em 2026' teve o melhor desempenho, com 10.000 visualizações.",
  },
  {
    id: "question:stale-dataset",
    kind: "question",
    title: "Qual é o Dataset mais desatualizado?",
    text: "O Dataset do YouTube não é atualizado há 45 dias.",
  },
  {
    id: "decision:lowest-cost-per-follower",
    kind: "decision",
    title: "Priorize a campanha mais eficiente",
    text: "A campanha de outubro teve o menor custo por seguidor. Ação recomendada: repita o formato.",
  },
  {
    id: "insight:audience-growth",
    kind: "insight",
    title: "Crescimento de audiência",
    text: "O território Sudeste teve o maior crescimento de seguidores no período.",
  },
];

describe("selectRelevantContext", () => {
  it("prioriza itens com sobreposição de palavras com a pergunta", () => {
    const selected = selectRelevantContext("Qual conteúdo teve melhor desempenho de visualizações?", ITEMS);

    expect(selected[0].id).toBe("question:best-content");
  });

  it("encontra itens relevantes por palavras-chave de domínio (campanha/custo)", () => {
    const selected = selectRelevantContext("Qual campanha teve o menor custo?", ITEMS);

    expect(selected[0].id).toBe("decision:lowest-cost-per-follower");
  });

  it("cai para um resumo geral (prioridade Decision > Insight > Question) quando não há sobreposição de palavras", () => {
    const selected = selectRelevantContext("E aí, como estamos?", ITEMS, 4);

    expect(selected).toHaveLength(4);
    expect(selected[0].kind).toBe("decision");
  });

  it("respeita o limite máximo de itens retornados", () => {
    const manyItems: IntelligenceChatContextItem[] = Array.from({ length: 10 }, (_, index) => ({
      id: `question:q${index}`,
      kind: "question" as const,
      title: `Pergunta sobre audiência número ${index}`,
      text: "audiência crescimento seguidores",
    }));

    const selected = selectRelevantContext("Como está a audiência e o crescimento de seguidores?", manyItems, 3);

    expect(selected).toHaveLength(3);
  });

  it("nunca lança quando não há itens de contexto", () => {
    expect(selectRelevantContext("qualquer pergunta", [])).toEqual([]);
  });
});
