"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  errorClassName,
  feedbackErrorClassName,
  inputClassName,
  labelClassName,
  successClassName,
  textareaClassName,
} from "@/components/forms/form-styles";
import { useFormSubmit } from "@/components/forms/useFormSubmit";

interface StoreInterestButtonProps {
  collectionId: string;
  collectionName: string;
  productId: string;
  productName: string;
}

interface InterestFormState {
  name: string;
  email: string;
  message: string;
}

export function StoreInterestButton({
  collectionId,
  collectionName,
  productId,
  productName,
}: StoreInterestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button type="button" onClick={() => setIsOpen(true)} className="w-full">
        Tenho interesse
      </Button>
    );
  }

  return (
    <StoreInterestDialog
      collectionId={collectionId}
      collectionName={collectionName}
      productId={productId}
      productName={productName}
      onClose={() => setIsOpen(false)}
    />
  );
}

function StoreInterestDialog({
  collectionId,
  collectionName,
  productId,
  productName,
  onClose,
}: StoreInterestButtonProps & { onClose: () => void }) {
  const [form, setForm] = useState<InterestFormState>({
    name: "",
    email: "",
    message: "",
  });
  const { fieldErrors, submitStatus, feedbackMessage, isLoading, submitForm, clearFieldError } =
    useFormSubmit("store-interesse");

  function updateField<K extends keyof InterestFormState>(key: K, value: InterestFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    clearFieldError(key);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitForm({
      ...form,
      collectionId,
      collectionName,
      productId,
      productName,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-interest-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bc-ink)]/70 p-4"
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)]">
              BookCringe Store
            </p>
            <h2 id="store-interest-title" className="mt-2 text-xl font-bold text-[var(--bc-ink)]">
              Tenho interesse
            </h2>
            <div className="mt-3 space-y-1 text-sm text-[var(--bc-muted)]">
              <p>
                <strong className="text-[var(--bc-ink)]">Produto de interesse:</strong>
              </p>
              <p>🛍️ {productName}</p>
              <p className="pt-1">
                <strong className="text-[var(--bc-ink)]">Coleção:</strong> {collectionName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário de interesse"
            className="text-2xl leading-none text-[var(--bc-muted)] transition hover:text-[var(--bc-ink)]"
          >
            ×
          </button>
        </div>

        {submitStatus === "success" ? (
          <div className="mt-6 space-y-4">
            <p role="status" className={`${successClassName} whitespace-pre-line`}>
              {feedbackMessage}
            </p>
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="collectionId" value={collectionId} readOnly />
            <input type="hidden" name="collectionName" value={collectionName} readOnly />
            <input type="hidden" name="productId" value={productId} readOnly />
            <input type="hidden" name="productName" value={productName} readOnly />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="store-interest-name" className={labelClassName}>
                Nome *
              </label>
              <input
                id="store-interest-name"
                type="text"
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClassName}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? <p className={errorClassName}>{fieldErrors.name}</p> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="store-interest-email" className={labelClassName}>
                E-mail *
              </label>
              <input
                id="store-interest-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClassName}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <p className={errorClassName}>{fieldErrors.email}</p> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="store-interest-message" className={labelClassName}>
                Mensagem (opcional)
              </label>
              <textarea
                id="store-interest-message"
                rows={3}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Se quiser, conte mais sobre o que você gostaria de ver na coleção."
                className={textareaClassName}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.message)}
              />
              {fieldErrors.message ? <p className={errorClassName}>{fieldErrors.message}</p> : null}
            </div>

            {feedbackMessage ? (
              <p role="alert" className={feedbackErrorClassName}>
                {feedbackMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar interesse"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
