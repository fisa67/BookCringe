"use client";

import { useState, type FormEvent } from "react";
import { useIntelligenceChat } from "@/components/admin/intelligence/useIntelligenceChat";

const SUGGESTED_QUESTIONS = [
  "Qual foi o conteúdo com melhor desempenho?",
  "Existe algum Dataset desatualizado?",
  "Qual campanha teve o menor custo por seguidor?",
];

/**
 * Interface do Intelligence Chat (Sprint 23) — camada de linguagem natural
 * sobre Questions/Insights/Decisions já existentes. Sem streaming, sem
 * histórico persistido: cada pergunta é uma chamada isolada a
 * `askIntelligenceChatAction` (via `useIntelligenceChat`).
 */
export function IntelligenceChat() {
  const { messages, isSending, errorMessage, sendQuestion, reset } = useIntelligenceChat();
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || isSending) return;
    sendQuestion(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-[16rem] space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={(question) => sendQuestion(question)} disabled={isSending} />
        ) : (
          messages.map((message, index) => <ChatBubble key={index} message={message} />)
        )}

        {isSending ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
            Consultando Questions, Insights e Decisions…
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <p role="alert" className="rounded-md border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          {errorMessage}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <label htmlFor="intelligence-chat-question" className="sr-only">
          Pergunta para o Chat de Intelligence
        </label>
        <input
          id="intelligence-chat-question"
          name="question"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Pergunte algo sobre a audiência, os conteúdos ou as campanhas…"
          disabled={isSending}
          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-md border border-emerald-700 bg-emerald-700/20 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Perguntar
        </button>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={reset}
            disabled={isSending}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar conversa
          </button>
        ) : null}
      </form>
    </div>
  );
}

function EmptyState({
  onSuggestionClick,
  disabled,
}: {
  onSuggestionClick: (question: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
      <p className="text-sm text-slate-400">
        Pergunte algo em português sobre a audiência, os conteúdos ou as campanhas já importadas.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestionClick(question)}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-700 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: { role: "user" | "assistant"; content: string } }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
          isUser ? "bg-emerald-700/20 text-emerald-100" : "border border-slate-800 bg-slate-900/80 text-slate-200"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
