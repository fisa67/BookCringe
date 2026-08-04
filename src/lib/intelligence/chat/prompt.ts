import type { IntelligenceChatContextItem } from "@/lib/intelligence/chat/types";

const KIND_LABELS: Record<IntelligenceChatContextItem["kind"], string> = {
  question: "Pergunta respondida",
  insight: "Insight",
  decision: "Decisão recomendada",
};

const SYSTEM_PROMPT = [
  "Você é o assistente do BookCringe Intelligence, um painel de análise de audiência e conteúdo.",
  "Responda sempre em português do Brasil, de forma amigável, direta e objetiva.",
  "Baseie-se exclusivamente nas informações fornecidas no contexto abaixo — elas já foram calculadas pelo sistema (Questions, Insights e Decisions).",
  "Nunca invente números, datas ou fatos que não estejam explicitamente no contexto.",
  "Se o contexto não tiver informação suficiente para responder à pergunta, diga isso educadamente e sugira que o usuário confira o Dashboard ou importe mais dados, em vez de arriscar um palpite.",
].join(" ");

export interface IntelligenceChatPrompt {
  system: string;
  user: string;
}

/**
 * Monta o prompt final enviado ao LLM (Sprint 23, item 5 do escopo) — texto
 * puro, sem nenhuma chamada de rede. `items` já vem filtrado por
 * `selectRelevantContext`; esta função só formata o que recebe.
 */
export function buildChatPrompt(question: string, items: IntelligenceChatContextItem[]): IntelligenceChatPrompt {
  const contextBlock =
    items.length > 0
      ? items.map((item) => `- [${KIND_LABELS[item.kind]}] ${item.title}: ${item.text}`).join("\n")
      : "Nenhuma informação relevante foi encontrada nas Questions, Insights ou Decisions já calculadas.";

  const user = [
    `Pergunta do usuário: "${question}"`,
    "",
    "Contexto disponível (já calculado pelo Intelligence, não invente nada além disso):",
    contextBlock,
  ].join("\n");

  return { system: SYSTEM_PROMPT, user };
}
