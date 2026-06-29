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
  partnershipTypeLabels,
  partnershipTypes,
  type PartnershipType,
} from "@/lib/validations/forms";

type FormState = {
  name: string;
  email: string;
  company: string;
  type: PartnershipType | "";
  message: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  company: "",
  type: "",
  message: "",
};

export function TrabalheComigoForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const {
    fieldErrors,
    submitStatus,
    feedbackMessage,
    isLoading,
    submitForm,
    clearFieldError,
  } = useFormSubmit("trabalhe-comigo");

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
          <label htmlFor="partnership-name" className={labelClassName}>
            Nome *
          </label>
          <input
            id="partnership-name"
            type="text"
            name="name"
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Seu nome"
            className={inputClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "partnership-name-error" : undefined
            }
          />
          {fieldErrors.name ? (
            <p id="partnership-name-error" className={errorClassName}>
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="partnership-email" className={labelClassName}>
            E-mail *
          </label>
          <input
            id="partnership-email"
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
              fieldErrors.email ? "partnership-email-error" : undefined
            }
          />
          {fieldErrors.email ? (
            <p id="partnership-email-error" className={errorClassName}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="partnership-company" className={labelClassName}>
            Empresa / Marca
          </label>
          <input
            id="partnership-company"
            type="text"
            name="company"
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Opcional"
            className={inputClassName}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.company)}
            aria-describedby={
              fieldErrors.company ? "partnership-company-error" : undefined
            }
          />
          {fieldErrors.company ? (
            <p id="partnership-company-error" className={errorClassName}>
              {fieldErrors.company}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="partnership-type" className={labelClassName}>
            Tipo de parceria *
          </label>
          <select
            id="partnership-type"
            name="type"
            required
            value={form.type}
            onChange={(event) =>
              updateField("type", event.target.value as PartnershipType | "")
            }
            className={`${inputClassName} appearance-none`}
            disabled={isLoading}
            aria-invalid={Boolean(fieldErrors.type)}
            aria-describedby={
              fieldErrors.type ? "partnership-type-error" : undefined
            }
          >
            <option value="">Selecione uma opção</option>
            {partnershipTypes.map((type) => (
              <option key={type} value={type}>
                {partnershipTypeLabels[type]}
              </option>
            ))}
          </select>
          {fieldErrors.type ? (
            <p id="partnership-type-error" className={errorClassName}>
              {fieldErrors.type}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="partnership-message" className={labelClassName}>
          Mensagem *
        </label>
        <textarea
          id="partnership-message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Conte sobre o projeto, produto ou ideia de parceria..."
          className={textareaClassName}
          disabled={isLoading}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? "partnership-message-error" : undefined
          }
        />
        {fieldErrors.message ? (
          <p id="partnership-message-error" className={errorClassName}>
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
        {isLoading ? "Enviando..." : "Enviar proposta"}
      </Button>
    </form>
  );
}
