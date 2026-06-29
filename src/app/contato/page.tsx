import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ContatoForm } from "@/components/forms/ContatoForm";
import { SOCIAL_LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com o BookCringe para parcerias, perguntas, sugestões ou apenas para bater um papo sobre livros.",
};

const socialItems = [
  { label: "Instagram", href: SOCIAL_LINKS.instagram, handle: "@bookcringe" },
  { label: "YouTube", href: SOCIAL_LINKS.youtube, handle: "@bookcringe" },
  { label: "TikTok", href: SOCIAL_LINKS.tiktok, handle: "@bookcringe" },
  { label: "Spotify", href: SOCIAL_LINKS.spotify, handle: "BookCringe Podcast" },
];

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos conversar?"
        description="Para parcerias, perguntas, sugestões ou apenas para falar sobre livros."
      />

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6">
              Enviar mensagem
            </p>
            <ContatoForm />
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-4">
                Redes sociais
              </p>
              <ul className="flex flex-col gap-3">
                {socialItems.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-lg border border-[var(--bc-border)] bg-white hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      <span className="text-sm font-medium text-[var(--bc-ink)]">{s.label}</span>
                      <span className="text-sm text-[var(--bc-muted)] group-hover:text-[var(--bc-ink)] transition-colors">
                        {s.handle} →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-[var(--bc-border)] bg-[var(--bc-surface)]">
              <p className="text-sm font-bold text-[var(--bc-ink)] mb-1">Tempo de resposta</p>
              <p className="text-sm text-[var(--bc-muted)] leading-relaxed">
                Respondo mensagens em até <strong>5 dias úteis</strong>. Para parcerias
                urgentes, entre em contato via Instagram.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
