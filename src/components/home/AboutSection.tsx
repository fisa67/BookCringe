import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const features = [
  {
    icon: "📚",
    title: "Biblioteca",
    description: "Todos os livros lidos, com resenhas, notas e reflexões. Filtrados por gênero, país e autor.",
    href: "/biblioteca",
  },
  {
    icon: "🎥",
    title: "Vídeos",
    description: "Resenhas em vídeo, listas, edições especiais e muito conteúdo para amantes de livros.",
    href: "https://youtube.com/@bookcringe",
    external: true,
  },
  {
    icon: "📊",
    title: "Estatísticas",
    description: "Dashboard completo de leitura com dados do Bookly. Metas, gêneros, países e tendências.",
    href: "/estatisticas",
  },
  {
    icon: "🤝",
    title: "Clube de Leitura",
    description: "Leituras compartilhadas, encontros virtuais e discussões sobre os livros do mês.",
    href: "/clube-de-leitura",
  },
];

export function AboutSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <SectionHeader
              eyebrow="O que é o BookCringe"
              title="Leitura sem frescura, mas com muito estilo."
            />
            <p className="text-[var(--bc-muted)] leading-relaxed mb-4">
              BookCringe nasceu da ideia de que os livros não precisam ser tratados com reverência excessiva.
              A leitura pode ser divertida, crítica, honesta — e um pouco cringe.
            </p>
            <p className="text-[var(--bc-muted)] leading-relaxed mb-8">
              Aqui você encontra resenhas sem spoiler (e às vezes com), listas
              questionáveis, dados que ninguém pediu e um clube de leitura que
              vai do romance teen ao cânone da literatura mundial.
            </p>
            <Link href="/sobre">
              <Button variant="outline">Saber mais sobre o projeto</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const inner = (
                <div className="group p-5 rounded-xl border border-[var(--bc-border)] bg-white hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200 h-full">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h3 className="font-bold text-[var(--bc-ink)] mb-1">{f.title}</h3>
                  <p className="text-sm text-[var(--bc-muted)] leading-relaxed">{f.description}</p>
                </div>
              );
              return f.external ? (
                <a key={f.title} href={f.href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <Link key={f.title} href={f.href}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
