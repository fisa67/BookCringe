import { NewsletterForm } from "@/components/forms/NewsletterForm";
import type { NewsletterSource } from "@/lib/types/cms";

interface NewsletterCTAProps {
  source: NewsletterSource;
  title: string;
  description: string;
  benefits?: readonly string[];
  buttonLabel?: string;
  /** Versão discreta (texto menor) — usada no CTA de fim de página em `/conteudos` e no card da página do livro. */
  compact?: boolean;
  /** "left" — usado no card inline da página do livro, que não é centralizado na página. */
  align?: "center" | "left";
  className?: string;
}

/**
 * Bloco de apresentação do "Crew Literário" — título +
 * descrição + `NewsletterForm`. Reaproveitado em 4 páginas (Home,
 * Recomendações, Livro, Conteúdos), cada uma com sua própria copy e
 * `source`, mas o mesmo componente/estilo — evita 4 formulários
 * divergentes. Posicionamento deliberado: "Crew Literário", nunca
 * "newsletter" na copy (ver instruções do produto).
 */
export function NewsletterCTA({
  source,
  title,
  description,
  benefits,
  buttonLabel,
  compact = false,
  align = "center",
  className,
}: NewsletterCTAProps) {
  const isCentered = align === "center";

  return (
    <div className={`${isCentered ? "max-w-xl mx-auto text-center" : ""} ${className ?? ""}`}>
      <h2
        className={
          compact
            ? "text-base font-bold text-[var(--bc-ink)] mb-1.5"
            : "text-2xl sm:text-3xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight mb-3"
        }
      >
        {title}
      </h2>
      <p className={compact ? "text-sm text-[var(--bc-muted)] mb-4" : "text-[var(--bc-muted)] leading-relaxed mb-6"}>
        {description}
      </p>
      {benefits && benefits.length > 0 ? (
        <ul className="mb-6 space-y-2 text-left text-sm text-[var(--bc-ink)]">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <span aria-hidden="true" className="font-bold text-[var(--bc-red)]">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <NewsletterForm
        source={source}
        buttonLabel={buttonLabel}
        className={isCentered ? undefined : "sm:max-w-md"}
      />
    </div>
  );
}
