"use client";

import { useState } from "react";
import { Rating } from "@/components/bookclub/Rating";
import {
  errorClassName,
  feedbackErrorClassName,
  inputClassName,
  labelClassName,
  successClassName,
  textareaClassName,
} from "@/components/forms/form-styles";
import type { PublicBookRatingSummary } from "@/lib/services/bookRatingService";

interface BookRatingsSectionProps {
  bookId: string;
  initialSummary: PublicBookRatingSummary;
}

type ApiResponse = {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
  summary?: PublicBookRatingSummary | null;
};

function formatAverage(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

export function BookRatingsSection({
  bookId,
  initialSummary,
}: BookRatingsSectionProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [accessFeedback, setAccessFeedback] = useState("");
  const [accessIsSuccess, setAccessIsSuccess] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccessLoading, setIsAccessLoading] = useState(false);

  async function handleRequestAccess() {
    setIsAccessLoading(true);
    setAccessFeedback("");
    setAccessIsSuccess(false);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: "Informe seu e-mail do Crew." });
      setIsAccessLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/book-ratings/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, email }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setFieldErrors(data.fields ?? {});
        setAccessFeedback(data.error ?? "Não foi possível solicitar o acesso.");
        return;
      }

      setAccessIsSuccess(true);
      setAccessFeedback(
        data.message ??
          "📬 Se este e-mail pertence a um membro confirmado, enviaremos um link para liberar sua avaliação."
      );
    } catch {
      setAccessFeedback("Erro de conexão. Tente novamente em alguns instantes.");
    } finally {
      setIsAccessLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);
    setFeedbackMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/book-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, rating, comment }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setFieldErrors(data.fields ?? {});
        setFeedbackMessage(data.error ?? "Não foi possível salvar sua avaliação.");
        return;
      }

      if (data.summary) {
        setSummary(data.summary);
      }
      setIsSuccess(true);
      setFeedbackMessage(data.message ?? "✅ Avaliação salva com sucesso.");
    } catch {
      setFeedbackMessage("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="community-ratings-title"
      className="mt-12 grid gap-8 border-t border-[var(--bc-border)] pt-10 lg:grid-cols-[1fr_360px]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--bc-red)]">
          Crew Literário
        </p>
        <h2 id="community-ratings-title" className="mt-2 text-2xl font-bold text-[var(--bc-ink)]">
          Avaliações da comunidade
        </h2>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-[var(--bc-surface)] p-5">
          {summary.average !== null ? (
            <>
              <Rating value={Math.round(summary.average)} size="lg" />
              <span className="text-3xl font-bold text-[var(--bc-ink)]">
                {formatAverage(summary.average)}
              </span>
              <span className="text-sm text-[var(--bc-muted)]">
                {summary.count} avaliação{summary.count === 1 ? "" : "ões"}
              </span>
            </>
          ) : (
            <p className="text-sm text-[var(--bc-muted)]">Este livro ainda não tem avaliações.</p>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-[var(--bc-ink)]">Últimas avaliações</h3>
          {summary.ratings.length === 0 ? (
            <p className="text-sm text-[var(--bc-muted)]">
              Seja a primeira pessoa do Crew a avaliar este livro.
            </p>
          ) : (
            <ul className="space-y-3">
              {summary.ratings.map((item) => (
                <li
                  key={`${item.updated_at}-${item.rating}-${item.comment ?? ""}`}
                  className="rounded-2xl border border-[var(--bc-border)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Rating value={item.rating} size="sm" />
                    <time dateTime={item.updated_at} className="text-xs text-[var(--bc-muted)]">
                      {formatDate(item.updated_at)}
                    </time>
                  </div>
                  {item.comment ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--bc-ink)]">
                      {item.comment}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="h-fit rounded-2xl border border-[var(--bc-border)] bg-white p-5 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-[var(--bc-ink)]">Avalie este livro</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--bc-muted)]">
          Solicite um link no seu e-mail confirmado. Se você já avaliou, o envio atualiza sua nota.
        </p>

        <div className="mt-5 flex flex-col gap-1.5">
          <span className={labelClassName}>Sua nota *</span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Sua nota">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} estrela${value === 1 ? "" : "s"}`}
                onClick={() => setRating(value)}
                className={`rounded-md px-1 text-2xl transition ${
                  value <= rating
                    ? "text-[var(--bc-red)]"
                    : "text-[var(--bc-border)] hover:text-[var(--bc-red)]"
                }`}
                disabled={isLoading}
              >
                ★
              </button>
            ))}
          </div>
          {fieldErrors.rating ? <p className={errorClassName}>{fieldErrors.rating}</p> : null}
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="book-rating-email" className={labelClassName}>
            E-mail do Crew
          </label>
          <input
            id="book-rating-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            disabled={isLoading || isAccessLoading}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
          />
          {fieldErrors.email ? <p className={errorClassName}>{fieldErrors.email}</p> : null}
          <button
            type="button"
            onClick={handleRequestAccess}
            disabled={isLoading || isAccessLoading}
            className="mt-2 self-start rounded-md border border-[var(--bc-ink)] px-3 py-2 text-xs font-semibold text-[var(--bc-ink)] transition hover:border-[var(--bc-red)] hover:text-[var(--bc-red)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAccessLoading ? "Enviando link..." : "Enviar link de acesso"}
          </button>
          {accessFeedback ? (
            <p
              role={accessIsSuccess ? "status" : "alert"}
              className={accessIsSuccess ? successClassName : feedbackErrorClassName}
            >
              {accessFeedback}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="book-rating-comment" className={labelClassName}>
            Comentário (opcional)
          </label>
          <textarea
            id="book-rating-comment"
            rows={4}
            maxLength={500}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className={textareaClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.comment)}
          />
          <p className="text-right text-xs text-[var(--bc-muted)]">{comment.length}/500</p>
          {fieldErrors.comment ? <p className={errorClassName}>{fieldErrors.comment}</p> : null}
        </div>

        {feedbackMessage ? (
          <p
            role={isSuccess ? "status" : "alert"}
            className={isSuccess ? `${successClassName} mt-4` : `${feedbackErrorClassName} mt-4`}
          >
            {feedbackMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || isAccessLoading || rating === 0}
          className="mt-5 w-full rounded-md bg-[var(--bc-ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--bc-red)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Salvando..." : "Salvar avaliação"}
        </button>
      </form>
    </section>
  );
}
