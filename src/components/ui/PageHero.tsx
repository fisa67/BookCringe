import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Selo/pílula pequeno acima de tudo (inclusive do `eyebrow`) — ex.: "📚 Livros escolhidos a dedo.". */
  badge?: ReactNode;
  eyebrow?: string;
  title: string;
  /** Linha de destaque abaixo do título — tagline curta, mais proeminente que `description`. */
  subtitle?: string;
  /** Aceita string (caso simples, igual antes) ou nós React — ex.: vários `<p>` para descrição em múltiplos parágrafos. */
  description?: ReactNode;
  /** Conteúdo extra abaixo da descrição — ex.: barra de métricas. Sem a restrição `max-w-2xl` do texto, para poder ocupar a largura toda do hero (`max-w-6xl`). */
  children?: ReactNode;
  className?: string;
}

export function PageHero({
  badge,
  eyebrow,
  title,
  subtitle,
  description,
  children,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("pt-28 pb-12 px-6", className)}>
      <div className="max-w-6xl mx-auto">
        {badge && (
          <span className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-[var(--bc-red)]/10 text-[var(--bc-red)] text-xs font-semibold">
            {badge}
          </span>
        )}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight max-w-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-xl md:text-2xl font-semibold text-[var(--bc-ink)] max-w-2xl leading-snug">
            {subtitle}
          </p>
        )}
        {description && (
          <div className="mt-4 space-y-3 text-lg text-[var(--bc-muted)] max-w-2xl leading-relaxed">
            {typeof description === "string" ? <p>{description}</p> : description}
          </div>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
