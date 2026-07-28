import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SubscriberSocialProof } from "@/components/forms/SubscriberSocialProof";
import { CREW_LITERARIO_TITLE, CREW_LITERARIO_TAGLINE } from "@/lib/constants";

/**
 * CTA da Home para o "Crew Literário" (Fase 3A) — banner leve que leva
 * para a landing page dedicada (`/crew-literario`), em vez de embutir o
 * form aqui (evita duas superfícies de captação concorrendo pelo mesmo
 * clique e concentra a conversão na landing, que já tem benefícios +
 * prova social). Título/tagline sempre iguais aos da landing
 * (`src/lib/constants.ts`) — nunca copy divergente entre os dois pontos de
 * entrada.
 */
export function NewsletterSection() {
  return (
    <section className="py-20 px-6 bg-[var(--bc-surface)] border-y border-[var(--bc-border)]">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight mb-3">
          {CREW_LITERARIO_TITLE}
        </h2>
        <p className="text-[var(--bc-muted)] leading-relaxed mb-6">{CREW_LITERARIO_TAGLINE}</p>
        <Link href="/crew-literario">
          <Button variant="primary" size="lg">
            Entrar no Crew 📚
          </Button>
        </Link>
        <SubscriberSocialProof className="mt-4" />
      </div>
    </section>
  );
}
