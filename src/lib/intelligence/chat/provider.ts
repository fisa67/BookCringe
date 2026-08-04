import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { getIntelligenceChatEnv } from "@/lib/env";

/**
 * Único ponto de acoplamento a um provedor real de LLM em todo o
 * Intelligence Chat (Sprint 23) — nenhum outro arquivo importa `ai` nem
 * `@ai-sdk/*` diretamente. Usa o padrão "OpenAI-compatible" do Vercel AI
 * SDK em vez de um pacote específico (`@ai-sdk/openai`, `@ai-sdk/anthropic`,
 * ...): qualquer provedor que implemente a Chat Completions API da OpenAI
 * (OpenAI, Groq, OpenRouter, um modelo local, etc.) funciona só trocando
 * `INTELLIGENCE_CHAT_BASE_URL`/`INTELLIGENCE_CHAT_MODEL` no ambiente — sem
 * alterar nenhuma linha de código, muito menos a UI.
 *
 * Retorna `null` quando a configuração não existe/é inválida — nunca lança,
 * para o serviço poder devolver um erro amigável em vez de derrubar a
 * aplicação (`getIntelligenceChatEnv` também nunca lança, ver `lib/env.ts`).
 */
export function getIntelligenceChatModel(): LanguageModel | null {
  const env = getIntelligenceChatEnv();
  if (!env) return null;

  const provider = createOpenAICompatible({
    name: "intelligence-chat",
    apiKey: env.INTELLIGENCE_CHAT_API_KEY,
    baseURL: env.INTELLIGENCE_CHAT_BASE_URL,
  });

  return provider(env.INTELLIGENCE_CHAT_MODEL);
}
