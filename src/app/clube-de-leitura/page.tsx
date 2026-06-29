import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { ClubeInteresseForm } from "@/components/forms/ClubeInteresseForm";
import { mockClubSessions } from "@/data/mock/stats";

export const metadata: Metadata = {
  title: "Clube de Leitura",
  description:
    "Leitura compartilhada, encontros mensais e discussões literárias. Participe do Clube de Leitura do BookCringe.",
};

export default function ClubePage() {
  const upcoming = mockClubSessions.filter((s) => s.isUpcoming);
  const past = mockClubSessions.filter((s) => !s.isUpcoming);

  return (
    <>
      <PageHero
        eyebrow="Clube de Leitura"
        title="Leia junto, pense junto."
        description="Encontros mensais para discutir livros, trocar perspectivas e criar conexões. Gratuito, online e aberto para todos."
      />

      {/* How it works */}
      <section className="py-12 px-6 border-b border-[var(--bc-border)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6">
            Como funciona
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Escolhemos um livro", text: "Todo mês, um livro é escolhido pelo BookCringe com tema específico." },
              { step: "02", title: "Vocês leem", text: "Um mês para ler no seu ritmo, sem pressão e sem julgamento." },
              { step: "03", title: "A gente conversa", text: "Encontro online com discussão aberta, análise e muito debate." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <span className="text-2xl font-bold text-[var(--bc-red)] shrink-0 leading-none mt-0.5">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-bold text-[var(--bc-ink)] mb-1">{s.title}</h3>
                  <p className="text-sm text-[var(--bc-muted)] leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-6">
              Próxima sessão
            </p>
            {upcoming.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-[var(--bc-border)] bg-[var(--bc-ink)] p-8"
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{session.book.title}</h2>
                    <p className="text-white/50 mb-4">{session.book.author}</p>
                    {session.theme && (
                      <p className="text-sm text-white/70 mb-2">
                        <span className="font-semibold">Tema:</span> {session.theme}
                      </p>
                    )}
                    {session.description && (
                      <p className="text-sm text-white/50 leading-relaxed mb-6">
                        {session.description}
                      </p>
                    )}
                    <Link href="/contato">
                      <Button variant="primary" size="md">
                        Quero participar
                      </Button>
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-white/10 select-none">
                      {new Date(session.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <p className="text-sm text-white/30 mt-2">
                      {new Date(session.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past sessions */}
      {past.length > 0 && (
        <section className="py-12 px-6 bg-[var(--bc-surface)]">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6">
              Sessões anteriores
            </p>
            <div className="flex flex-col gap-4">
              {past.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-[var(--bc-border)] bg-white"
                >
                  <div>
                    <h3 className="font-bold text-[var(--bc-ink)]">{session.book.title}</h3>
                    <p className="text-sm text-[var(--bc-muted)]">{session.book.author}</p>
                    {session.theme && (
                      <p className="text-xs text-[var(--bc-muted)] mt-1">Tema: {session.theme}</p>
                    )}
                  </div>
                  <p className="text-sm text-[var(--bc-muted)] shrink-0">
                    {new Date(session.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[var(--bc-ink)] mb-4">
              Quer ser avisado das próximas edições?
            </h2>
            <p className="text-[var(--bc-muted)] leading-relaxed">
              Deixe seu contato e te avisamos quando a inscrição para a próxima sessão abrir.
            </p>
          </div>
          <ClubeInteresseForm />
        </div>
      </section>
    </>
  );
}
