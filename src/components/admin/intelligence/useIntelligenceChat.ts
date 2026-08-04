"use client";

import { useCallback, useRef, useState } from "react";
import { askIntelligenceChatAction } from "@/app/admin/intelligence/chat/actions";
import type { IntelligenceChatMessage } from "@/lib/intelligence/chat/types";

export interface IntelligenceChatState {
  messages: IntelligenceChatMessage[];
  isSending: boolean;
  errorMessage: string | null;
}

const EMPTY_STATE: IntelligenceChatState = {
  messages: [],
  isSending: false,
  errorMessage: null,
};

/**
 * Orquestra o Chat no cliente: mantém o histórico local (nunca persistido —
 * o Chat é só uma camada de leitura sobre Questions/Insights/Decisions) e
 * chama `askIntelligenceChatAction` a cada pergunta, mesmo padrão de
 * `useImportSession` (chamada direta à Server Action, sem `<form>`/redirect,
 * resultado renderizado inline).
 *
 * `tokenRef` evita que uma resposta antiga sobrescreva o estado depois de
 * `reset()` — mesma proteção já usada em `useImportSession`.
 */
export function useIntelligenceChat() {
  const [state, setState] = useState<IntelligenceChatState>(EMPTY_STATE);
  const tokenRef = useRef(0);

  const sendQuestion = useCallback((question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const token = (tokenRef.current += 1);

    setState((current) => ({
      messages: [...current.messages, { role: "user", content: trimmed }],
      isSending: true,
      errorMessage: null,
    }));

    void (async () => {
      const formData = new FormData();
      formData.set("question", trimmed);

      try {
        const result = await askIntelligenceChatAction(formData);
        if (tokenRef.current !== token) return;

        if (result.status === "ok") {
          setState((current) => ({
            ...current,
            isSending: false,
            messages: [...current.messages, { role: "assistant", content: result.reply }],
          }));
        } else {
          setState((current) => ({ ...current, isSending: false, errorMessage: result.message }));
        }
      } catch {
        if (tokenRef.current !== token) return;
        setState((current) => ({
          ...current,
          isSending: false,
          errorMessage: "Não foi possível consultar o Chat de Intelligence agora. Tente novamente.",
        }));
      }
    })();
  }, []);

  const reset = useCallback(() => {
    tokenRef.current += 1;
    setState(EMPTY_STATE);
  }, []);

  return { ...state, sendQuestion, reset };
}
