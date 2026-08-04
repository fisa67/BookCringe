/**
 * Intelligence Chat (Sprint 23, `/admin/intelligence/chat`): camada de
 * linguagem natural sobre Questions, Insights e Decisions já existentes —
 * não cria nenhuma inteligência nova, só traduz o que os três módulos já
 * calculam para uma resposta em português. Sem RAG, sem embeddings, sem
 * banco vetorial, sem agentes: o "contexto" enviado ao LLM é sempre uma
 * lista curta e determinística de textos já prontos (`QuestionAnswer.summary`,
 * `Insight.message`, `Decision.description`).
 */

export type IntelligenceChatContextKind = "question" | "insight" | "decision";

/** Um item de contexto já pronto para leitura — nunca um registro bruto de Dataset/Metric. */
export interface IntelligenceChatContextItem {
  id: string;
  kind: IntelligenceChatContextKind;
  title: string;
  text: string;
}

export interface IntelligenceChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type IntelligenceChatResult =
  | { status: "ok"; reply: string; usedContext: string[] }
  | { status: "error"; message: string };
