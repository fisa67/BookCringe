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

type FormState = {
  name: string;
  email: string;
  message: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  message: "",
};

export function ClubeInteresseForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const {
    fieldErrors,
    submitStatus,
    feedbackMessage,
    isLoading,
    submitForm,
    clearFieldError,
  } = useFormSubmit("clube-de-leitura");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    clearFieldError(key);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await submitForm(form, () => setForm(initialFormState));
    if (!success) return;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="club-name" className={labelClassName}>
            Nome *
          </label>
          <input
            id="club-name"
            type="text"
            name="name"
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Seu nome"
            className={inputClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "club-name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="club-name-error" className={errorClassName}>
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="club-email" className={labelClassName}>
            E-mail *
          </label>
          <input
            id="club-email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="seu@email.com"
            className={inputClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "club-email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p id="club-email-error" className={errorClassName}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="club-message" className={labelClassName}>
          Mensagem *
        </label>
        <textarea
          id="club-message"
          name="message"
          required
          rows={4}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Conte por que quer participar do clube..."
          className={textareaClassName}
          disabled={isLoading}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? "club-message-error" : undefined
          }
        />
        {fieldErrors.message ? (
          <p id="club-message-error" className={errorClassName}>
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      {feedbackMessage ? (
        <p
          role="status"
          className={
            submitStatus === "success" ? successClassName : feedbackErrorClassName
          }
        >
          {feedbackMessage}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isLoading} className="w-fit">
        {isLoading ? "Enviando..." : "Quero ser avisado"}
      </Button>
    </form>
  );
}
