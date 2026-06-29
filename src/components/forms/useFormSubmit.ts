"use client";

import { useState } from "react";
import type { FormType } from "@/lib/validations/forms";

type SubmitStatus = "idle" | "loading" | "success" | "error";

type ApiResponse = {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
};

export function useFormSubmit(formType: FormType) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const isLoading = submitStatus === "loading";

  async function submitForm(
    payload: Record<string, string>,
    onSuccess?: () => void
  ) {
    setSubmitStatus("loading");
    setFeedbackMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType, ...payload }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        if (data.fields) {
          setFieldErrors(data.fields);
        }

        setSubmitStatus("error");
        setFeedbackMessage(
          data.error ?? "Não foi possível enviar sua mensagem."
        );
        return false;
      }

      setSubmitStatus("success");
      setFeedbackMessage(
        data.message ??
          "Mensagem enviada com sucesso! Você receberá um e-mail de confirmação em breve."
      );
      onSuccess?.();
      return true;
    } catch {
      setSubmitStatus("error");
      setFeedbackMessage(
        "Erro de conexão. Verifique sua internet e tente novamente."
      );
      return false;
    }
  }

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  return {
    fieldErrors,
    submitStatus,
    feedbackMessage,
    isLoading,
    submitForm,
    clearFieldError,
  };
}
