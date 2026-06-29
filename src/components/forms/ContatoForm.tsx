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
import {
  contactSubjectLabels,
  contactSubjects,
  type ContactSubject,
} from "@/lib/validations/forms";

type FormState = {
  name: string;
  email: string;
  subject: ContactSubject | "";
  message: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContatoForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const {
    fieldErrors,
    submitStatus,
    feedbackMessage,
    isLoading,
    submitForm,
    clearFieldError,
  } = useFormSubmit("contato");

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className={labelClassName}>
            Nome *
          </label>
          <input
            id="contact-name"
            type="text"
            name="name"
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Seu nome"
            className={inputClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="contact-name-error" className={errorClassName}>
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className={labelClassName}>
            E-mail *
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="seu@email.com"
            className={inputClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "contact-email-error" : undefined
            }
          />
          {fieldErrors.email ? (
            <p id="contact-email-error" className={errorClassName}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-subject" className={labelClassName}>
          Assunto *
        </label>
        <select
          id="contact-subject"
          name="subject"
          required
          value={form.subject}
          onChange={(event) =>
            updateField("subject", event.target.value as ContactSubject | "")
          }
          className={`${inputClassName} appearance-none`}
          disabled={isLoading}
          aria-invalid={Boolean(fieldErrors.subject)}
          aria-describedby={
            fieldErrors.subject ? "contact-subject-error" : undefined
          }
        >
          <option value="">Selecione um assunto</option>
          {contactSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {contactSubjectLabels[subject]}
            </option>
          ))}
        </select>
        {fieldErrors.subject ? (
          <p id="contact-subject-error" className={errorClassName}>
            {fieldErrors.subject}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className={labelClassName}>
          Mensagem *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Escreva sua mensagem..."
          className={textareaClassName}
          disabled={isLoading}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? "contact-message-error" : undefined
          }
        />
        {fieldErrors.message ? (
          <p id="contact-message-error" className={errorClassName}>
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

      <Button type="submit" disabled={isLoading} className="w-fit">
        {isLoading ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
