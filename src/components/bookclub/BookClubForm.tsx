"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RegistrationPayload } from "@/lib/bookclub";

// ─────────────────────────────────────────────
// Turnstile widget (lazy-loaded)
// ─────────────────────────────────────────────

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (id: string) => void;
    };
  }
}

function TurnstileWidget({
  siteKey,
  onVerify,
  onExpire,
}: {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>("");

  useEffect(() => {
    const init = () => {
      if (!ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
        theme: "light",
      });
    };

    const scriptId = "cf-turnstile-js";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.head.appendChild(s);
    } else if (window.turnstile) {
      init();
    }
  }, [siteKey, onVerify, onExpire]);

  return <div ref={ref} className="mt-2" />;
}

// ─────────────────────────────────────────────
// Input / Select helpers
// ─────────────────────────────────────────────

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[var(--bc-ink)] mb-1.5"
    >
      {children}
      {required && (
        <span className="text-[var(--bc-red)] ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

const inputClass = cn(
  "w-full h-10 px-3 rounded-lg border border-[var(--bc-border)] bg-white",
  "text-sm text-[var(--bc-ink)] placeholder:text-[var(--bc-muted)]",
  "focus:outline-none focus:border-[var(--bc-ink)] transition-colors duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

const textareaClass = cn(
  "w-full px-3 py-2.5 rounded-lg border border-[var(--bc-border)] bg-white",
  "text-sm text-[var(--bc-ink)] placeholder:text-[var(--bc-muted)] resize-none",
  "focus:outline-none focus:border-[var(--bc-ink)] transition-colors duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

const selectClass = cn(
  "w-full h-10 px-3 rounded-lg border border-[var(--bc-border)] bg-white appearance-none",
  "text-sm text-[var(--bc-ink)]",
  "focus:outline-none focus:border-[var(--bc-ink)] transition-colors duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group select-none"
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bc-red)]",
          checked ? "bg-[var(--bc-red)]" : "bg-[var(--bc-border)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
      <span className="text-sm text-[var(--bc-ink)] group-hover:text-[var(--bc-ink)]">
        {label}
      </span>
    </label>
  );
}

// ─────────────────────────────────────────────
// Form state types
// ─────────────────────────────────────────────

type FormValues = {
  name: string;
  contact: string;
  platform: RegistrationPayload["platform"];
  readingProfile: RegistrationPayload["readingProfile"];
  interests: string;
  message: string;
  monthlyMeetings: boolean;
  canNotify: boolean;
  _hp: string; // honeypot
};

type FieldErrors = Partial<Record<keyof FormValues | "_general", string>>;
type SubmitState = "idle" | "loading" | "success";

const DEFAULT_VALUES: FormValues = {
  name: "",
  contact: "",
  platform: "instagram",
  readingProfile: "casual",
  interests: "",
  message: "",
  monthlyMeetings: true,
  canNotify: true,
  _hp: "",
};

// ─────────────────────────────────────────────
// Client-side validation
// ─────────────────────────────────────────────

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2)
    errors.name = "Informe seu nome completo.";
  if (values.contact.trim().length < 3)
    errors.contact = "Informe um e-mail ou número de WhatsApp.";
  if (values.interests.trim().length < 10)
    errors.interests = "Conta um pouco mais (mínimo 10 caracteres).";
  return errors;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

interface BookClubFormProps {
  id?: string;
}

export function BookClubForm({ id = "inscricao" }: BookClubFormProps) {
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const sectionRef = useRef<HTMLElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? "";
  const showTurnstile = siteKey.length > 0;

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fieldErrors = validate(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      // Scroll to first error
      sectionRef.current
        ?.querySelector("[aria-invalid='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (showTurnstile && !turnstileToken) {
      toast.error("Confirme que você não é um robô antes de enviar.");
      return;
    }

    setState("loading");

    const payload: RegistrationPayload & { _hp?: string } = {
      name: values.name.trim(),
      contact: values.contact.trim(),
      platform: values.platform,
      readingProfile: values.readingProfile,
      interests: values.interests.trim(),
      message: values.message.trim() || undefined,
      monthlyMeetings: values.monthlyMeetings,
      canNotify: values.canNotify,
      turnstileToken: turnstileToken || undefined,
      _hp: values._hp,
    };

    try {
      const res = await fetch("/api/bookclub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors({ _general: json.error ?? "Erro ao enviar. Tente novamente." });
        setState("idle");
        toast.error("Não foi possível enviar. Tente novamente.");
        return;
      }

      setState("success");
      toast.success("Inscrição enviada! Em breve você recebe novidades.");
    } catch {
      setErrors({ _general: "Erro de conexão. Verifique sua internet." });
      setState("idle");
      toast.error("Erro de conexão. Verifique sua internet.");
    }
  }

  // Auto-scroll to success message
  useEffect(() => {
    if (state === "success") {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  const isLoading = state === "loading";

  return (
    <section
      id={id}
      ref={sectionRef}
      className="py-16 px-6 scroll-mt-20"
      aria-labelledby="form-heading"
    >
      <Toaster position="bottom-right" richColors />

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-2">
            Inscrição
          </p>
          <h2
            id="form-heading"
            className="text-3xl font-bold text-[var(--bc-ink)] tracking-tight mb-2"
          >
            Quero participar do clube
          </h2>
          <p className="text-[var(--bc-muted)]">
            Campos marcados com{" "}
            <span className="text-[var(--bc-red)]">*</span> são obrigatórios.
          </p>
        </div>

        {/* Success state */}
        {state === "success" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <span className="text-4xl" aria-hidden="true">
              📚
            </span>
            <h3 className="mt-4 text-xl font-bold text-[var(--bc-ink)]">
              Inscrição recebida!
            </h3>
            <p className="mt-2 text-[var(--bc-muted)] leading-relaxed max-w-sm mx-auto">
              Obrigado pela inscrição no Clube de Leitura BookCringe. Em breve
              você receberá novidades por aqui.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
            aria-busy={isLoading}
          >
            {/* Honeypot — must stay hidden */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              className="absolute -left-full w-0 h-0 overflow-hidden opacity-0"
              value={values._hp}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("_hp", e.target.value)}
            />

            {/* ── Section 1: Identity */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] pb-1">
                Quem é você
              </legend>

              <div>
                <Label htmlFor="name" required>
                  Nome completo
                </Label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  className={cn(inputClass, errors.name && "border-red-400")}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                <FieldError message={errors.name} />
              </div>

              <div>
                <Label htmlFor="contact" required>
                  Contato (e-mail ou WhatsApp)
                </Label>
                <input
                  id="contact"
                  type="text"
                  autoComplete="email tel"
                  placeholder="seu@email.com ou +55 11 9..."
                  className={cn(inputClass, errors.contact && "border-red-400")}
                  value={values.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!errors.contact}
                  aria-describedby={errors.contact ? "contact-error" : undefined}
                />
                <FieldError message={errors.contact} />
              </div>
            </fieldset>

            {/* ── Section 2: Preferences */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] pb-1">
                Preferências
              </legend>

              <div>
                <Label htmlFor="platform">
                  Onde prefere acompanhar o clube?
                </Label>
                <div className="relative">
                  <select
                    id="platform"
                    className={selectClass}
                    value={values.platform}
                    onChange={(e) =>
                      set("platform", e.target.value as FormValues["platform"])
                    }
                    disabled={isLoading}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="all">Todos os canais</option>
                  </select>
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bc-muted)] pointer-events-none text-xs"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="readingProfile">
                  Qual é a sua relação com a leitura?
                </Label>
                <div className="relative">
                  <select
                    id="readingProfile"
                    className={selectClass}
                    value={values.readingProfile}
                    onChange={(e) =>
                      set(
                        "readingProfile",
                        e.target.value as FormValues["readingProfile"]
                      )
                    }
                    disabled={isLoading}
                  >
                    <option value="casual">Leitor casual</option>
                    <option value="frequent">Leitor frequente</option>
                    <option value="booktuber">
                      Booktuber / Bookstagrammer
                    </option>
                    <option value="returning">Voltando a ler</option>
                  </select>
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bc-muted)] pointer-events-none text-xs"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </div>
              </div>
            </fieldset>

            {/* ── Section 3: Interests */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] pb-1">
                Sobre o clube
              </legend>

              <div>
                <Label htmlFor="interests" required>
                  O que você procura no clube?
                </Label>
                <textarea
                  id="interests"
                  rows={3}
                  placeholder="Trocar indicações, discutir livros, encontrar comunidade..."
                  className={cn(textareaClass, errors.interests && "border-red-400")}
                  value={values.interests}
                  onChange={(e) => set("interests", e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!errors.interests}
                  aria-describedby={errors.interests ? "interests-error" : undefined}
                />
                <FieldError message={errors.interests} />
              </div>

              <div>
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Algo mais que queira contar..."
                  className={textareaClass}
                  value={values.message}
                  onChange={(e) => set("message", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </fieldset>

            {/* ── Section 4: Availability */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] pb-1">
                Disponibilidade
              </legend>

              <Toggle
                id="monthly"
                label="Participaria de encontros mensais online?"
                checked={values.monthlyMeetings}
                onChange={(v) => set("monthlyMeetings", v)}
                disabled={isLoading}
              />

              <Toggle
                id="notify"
                label="Posso te avisar quando uma nova leitura abrir?"
                checked={values.canNotify}
                onChange={(v) => set("canNotify", v)}
                disabled={isLoading}
              />
            </fieldset>

            {/* ── Turnstile */}
            {showTurnstile && (
              <TurnstileWidget
                siteKey={siteKey}
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
              />
            )}

            {/* ── General error */}
            {errors._general && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                {errors._general}
              </p>
            )}

            {/* ── Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full sm:w-auto h-12 px-8 rounded-lg font-medium text-white transition-all duration-150",
                "bg-[var(--bc-red)] hover:bg-[var(--bc-red-dark)] active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
                "flex items-center justify-center gap-2"
              )}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Enviando...
                </>
              ) : (
                "Quero participar"
              )}
            </button>

            <p className="text-xs text-[var(--bc-muted)]">
              Ao enviar, você concorda em receber comunicações do BookCringe.
              Sem spam, prometemos.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
