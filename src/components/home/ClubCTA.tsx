import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { mockClubSessions } from "@/data/mock/stats";

export function ClubCTA() {
  const next = mockClubSessions.find((s) => s.isUpcoming);

  return (
    <section className="py-20 px-6 bg-[var(--bc-ink)]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-3">
            Clube de Leitura
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            Leia junto com a gente.
          </h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-md">
            Encontros mensais para discutir livros, trocar perspectivas e descobrir
            novas leituras. Gratuito, online e sem julgamento.
          </p>
          <Link href="/clube-de-leitura">
            <Button variant="primary" size="lg">
              Participar do clube
            </Button>
          </Link>
        </div>

        {next && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-4">
              Próxima sessão
            </p>
            <h3 className="text-xl font-bold text-white mb-1">{next.book.title}</h3>
            <p className="text-white/50 text-sm mb-4">{next.book.author}</p>
            {next.theme && (
              <p className="text-white/70 text-sm mb-1 font-medium">Tema: {next.theme}</p>
            )}
            {next.description && (
              <p className="text-white/50 text-sm leading-relaxed">{next.description}</p>
            )}
            <p className="mt-4 text-xs text-white/30">
              {new Date(next.date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
