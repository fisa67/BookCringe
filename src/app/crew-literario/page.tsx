import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SubscriberSocialProof } from "@/components/forms/SubscriberSocialProof";
import {
  CREW_LITERARIO_TITLE,
  CREW_LITERARIO_TAGLINE,
  CREW_LITERARIO_BENEFITS,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Crew Literário",
  description:
    "Junte-se ao Crew Literário do BookCringe: recomendações de leitura, curadoria, bastidores e novos conteúdos direto no seu e-mail.",
};

export const revalidate = 3600;

const CREW_LITERARIO_CTA_LABEL = "Entrar para o Crew Literário 📚";

export default function CrewLiterarioPage() {
  return (
    <PageHero
      badge="👋 Audiência do BookCringe"
      eyebrow="Crew Literário"
      title={CREW_LITERARIO_TITLE}
      subtitle={CREW_LITERARIO_TAGLINE}
    >
      <div className="max-w-md space-y-8">
        <ul className="space-y-3">
          {CREW_LITERARIO_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-3 text-base text-[var(--bc-ink)]"
            >
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
          <NewsletterForm
            source="crew_literario"
            buttonLabel={CREW_LITERARIO_CTA_LABEL}
          />
          <SubscriberSocialProof />
        </div>
      </div>
    </PageHero>
  );
}