"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { NewsletterSource } from "@/lib/types/cms";

type SubmitStatus = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps {
  /** Página de origem da inscrição — persistido em `newsletter_subscribers.source`. */
  source: NewsletterSource;
  className?: string;
  buttonLabel?: string;
}

/**
 * Peça atômica (client) do "Clube dos Leitores BookCringe" — input de
 * e-mail + botão + feedback inline. Reaproveitada em `NewsletterCTA`
 * (Home, Recomendações, Livro, Conteúdos). Mesmo padrão de `ContatoForm`/
 * `useFormSubmit` (client + `fetch` para uma API Route, sem Server
 * Action — Server Actions neste projeto são só para o admin), mas mantido
 * self-contained aqui por ser um formulário de um único campo.
 */
export function NewsletterForm({ source, className, buttonLabel = "buttonLabel = "Entrar no Crew" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Não foi possível concluir sua inscrição.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "🎉 Bem-vindo ao Crew Literário do BookCringe!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className={`text-sm font-semibold text-[var(--bc-ink)] ${className ?? ""}`}>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className ?? ""}`}>
      <label htmlFor={`newsletter-email-${source}`} className="sr-only">
        Seu melhor e-mail
      </label>
      <input
        id={`newsletter-email-${source}`}
        type="email"
        name="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Seu melhor e-mail"
        disabled={status === "loading"}
        aria-invalid={status === "error"}
        className="h-11 flex-1 min-w-0 px-4 rounded-full border border-[var(--bc-border)] bg-white text-sm text-[var(--bc-ink)] placeholder:text-[var(--bc-muted)] focus:outline-none focus:border-[var(--bc-ink)] transition-colors"
      />
      <Button type="submit" disabled={status === "loading"} className="shrink-0">
        {status === "loading" ? "Enviando..." : buttonLabel}
      </Button>
      {status === "error" && message ? (
        <p role="alert" className="text-xs text-[var(--bc-red)] sm:basis-full sm:text-center">
          {message}
        </p>
      ) : null}
    </form>
  );
}
