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

// Página de captação dedicada do Crew Literário. Revalidate mais curto que
// as demais páginas públicas (a maioria usa 3600s = 1h) porque a prova
// social (`SubscriberSocialProof`) depende do total de inscritos, que é
// justamente o número que mais queremos refletir rápido logo depois de uma
// campanha/divulgação — com 3600s, a página podia passar a faixa de "10
// inscritos" na base e continuar sem mostrar nada por até 1h, até a próxima
// visita disparar a regeneração (ISR/Full Route Cache do Next.js: a página
// só é re-renderizada quando alguém a acessa depois da janela expirar).
export const revalidate = 300;

const CREW_LITERARIO_CTA_LABEL = "Entrar para o Crew Literário 📚";

/**
 * Landing page dedicada do "Crew Literário" — infraestrutura de construção
 * de audiência (captação, prova social, e-mail de boas-vindas e
 * newsletters são disparados por outras partes do app). Ordem deliberada
 * dentro do hero — título → subtítulo → benefícios → form → prova social —
 * para o form já vir com o valor justificado antes do pedido de e-mail.
 * Reaproveita `NewsletterForm` (mesmo client component/endpoint das outras
 * páginas com captação) — nenhuma lógica de inscrição duplicada aqui, só
 * `source="crew_literario"` muda. Um único formulário nesta página (sem
 * CTA repetido no rodapé — corrigido para evitar cadastro duplicado). Sem
 * `AffiliateDisclosure`: essa página não linka para a Amazon, o disclosure
 * é exclusivo de páginas de livro (`/recomendacoes`, `/livro/[slug]`,
 * `/biblioteca`).
 */
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
