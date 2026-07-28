import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SubscriberSocialProof } from "@/components/forms/SubscriberSocialProof";
import { CREW_LITERARIO_TITLE, CREW_LITERARIO_TAGLINE, CREW_LITERARIO_BENEFITS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Crew Literário",
  description:
    "Junte-se ao Crew Literário do BookCringe: recomendações de leitura, curadoria, bastidores e novos conteúdos direto no seu e-mail.",
};

// Página de captação dedicada do Crew Literário (Fase 3A) — mesma
// estratégia de `revalidate` das demais páginas públicas com dado do
// Supabase (aqui, só a prova social depende de dado ao vivo).
export const revalidate = 3600;

const CREW_LITERARIO_CTA_LABEL = "Entrar para o Crew Literário 📚";

/**
 * Landing page dedicada do "Crew Literário" (Fase 3A — infraestrutura de
 * construção de audiência, sem envio de e-mails ainda). Ordem deliberada
 * dentro do hero — título → subtítulo → benefícios → form → prova social —
 * para o form já vir com o valor justificado antes do pedido de e-mail.
 * Reaproveita `NewsletterForm` (mesmo client component/endpoint das outras
 * páginas com captação) — nenhuma lógica de inscrição duplicada aqui, só
 * `source="crew_literario"` muda. Sem `AffiliateDisclosure`: essa página
 * não linka para a Amazon, o disclosure é exclusivo de páginas de livro
 * (`/recomendacoes`, `/livro/[slug]`, `/biblioteca`).
 */
export default function CrewLiterarioPage() {
  return (
    <>
      <PageHero
        badge="👋 Audiência do BookCringe"
        eyebrow="Crew Literário"
        title={CREW_LITERARIO_TITLE}
        subtitle={CREW_LITERARIO_TAGLINE}
      >
        <div className="max-w-md space-y-8">
          <ul className="space-y-3">
            {CREW_LITERARIO_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-base text-[var(--bc-ink)]">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bc-red)]/10 text-[var(--bc-red)] font-bold"
                >
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <NewsletterForm source="crew_literario" buttonLabel={CREW_LITERARIO_CTA_LABEL} />
            <SubscriberSocialProof />
          </div>
        </div>
      </PageHero>

      <section className="py-16 px-6 bg-[var(--bc-surface)] border-t border-[var(--bc-border)]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight mb-3">
            {CREW_LITERARIO_TITLE}
          </h2>
          <p className="text-[var(--bc-muted)] leading-relaxed mb-6">{CREW_LITERARIO_TAGLINE}</p>
          <NewsletterForm
            source="crew_literario"
            buttonLabel={CREW_LITERARIO_CTA_LABEL}
            className="sm:justify-center"
          />
        </div>
      </section>
    </>
  );
}
