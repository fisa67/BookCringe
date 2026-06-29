import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
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
          {/* Form */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6">
              Enviar mensagem
            </p>
            <form className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-[var(--bc-ink)]">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    className="h-10 px-3 rounded-lg border border-[var(--bc-border)] bg-white text-sm text-[var(--bc-ink)] placeholder:text-[var(--bc-muted)] focus:outline-none focus:border-[var(--bc-ink)] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[var(--bc-ink)]">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="h-10 px-3 rounded-lg border border-[var(--bc-border)] bg-white text-sm text-[var(--bc-ink)] placeholder:text-[var(--bc-muted)] focus:outline-none focus:border-[var(--bc-ink)] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-sm font-medium text-[var(--bc-ink)]">
                  Assunto
                </label>
                <select
                  id="subject"
                  className="h-10 px-3 rounded-lg border border-[var(--bc-border)] bg-white text-sm text-[var(--bc-ink)] focus:outline-none focus:border-[var(--bc-ink)] transition-colors appearance-none"
                >
                  <option value="">Selecione um assunto</option>
                  <option value="parceria">Parceria comercial</option>
                  <option value="resenha">Envio de livro para resenha</option>
                  <option value="clube">Clube de Leitura</option>
                  <option value="sugestao">Sugestão de livro</option>
                  <option value="outro">Outro assunto</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-[var(--bc-ink)]">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Escreva sua mensagem..."
                  className="px-3 py-2.5 rounded-lg border border-[var(--bc-border)] bg-white text-sm text-[var(--bc-ink)] placeholder:text-[var(--bc-muted)] focus:outline-none focus:border-[var(--bc-ink)] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="h-10 px-6 rounded-lg bg-[var(--bc-red)] text-white text-sm font-medium hover:bg-[var(--bc-red-dark)] active:scale-[0.98] transition-all duration-150 w-fit"
              >
                Enviar mensagem
              </button>
            </form>
          </div>

          {/* Info */}
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
