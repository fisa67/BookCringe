"use server";

import { requireOwnerId } from "@/lib/auth/ownerId";
import { askIntelligenceChat } from "@/lib/services/intelligenceChatService";
import type { IntelligenceChatResult } from "@/lib/intelligence/chat/types";

/**
 * Chamada diretamente pelo componente cliente (`IntelligenceChat`), sem
 * `<form>`/redirect — mesmo padrão de `previewImportAction`
 * (`importacoes/actions.ts`): o resultado é renderizado inline na própria
 * página, sem navegação.
 */
export async function askIntelligenceChatAction(formData: FormData): Promise<IntelligenceChatResult> {
  const question = formData.get("question");

  if (typeof question !== "string") {
    return { status: "error", message: "Digite uma pergunta para o Chat de Intelligence." };
  }

  const ownerId = await requireOwnerId();
  return askIntelligenceChat(ownerId, question);
}
