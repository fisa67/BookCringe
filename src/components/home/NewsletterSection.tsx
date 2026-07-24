import { NewsletterCTA } from "@/components/forms/NewsletterCTA";

/**
 * Seção de captação do "Clube dos Leitores BookCringe" na Home — Fase 2A
 * (construir uma base própria de leitores; sem avaliações de comunidade
 * nesta fase, ver `NewsletterForm`/`subscriberService.ts`).
 */
export function NewsletterSection() {
  return (
    <section className="py-20 px-6 bg-[var(--bc-surface)] border-y border-[var(--bc-border)]">
      <NewsletterCTA
        source="home"
        title="📚 Clube dos Leitores BookCringe"
        description="Uma vez por mês envio recomendações de leitura, conteúdos publicados, reflexões e novidades do BookCringe."
      />
    </section>
  );
}
