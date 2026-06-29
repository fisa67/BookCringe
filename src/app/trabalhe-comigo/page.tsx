import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Trabalhe Comigo",
  description:
    "Parcerias, colaborações, resenhas patrocinadas, mídia kit e oportunidades de trabalho com o BookCringe.",
};

const services = [
  {
    title: "Resenha patrocinada",
    description:
      "Leitura e resenha honesta do seu livro ou produto literário. Publicado nos canais do BookCringe com alcance real.",
    tags: ["Editoras", "Autores"],
  },
  {
    title: "Publicidade em vídeo",
    description:
      "Integração no YouTube ou TikTok, menção patrocinada ou vídeo dedicado. Formato definido juntos.",
    tags: ["Marcas", "Editoras"],
  },
  {
    title: "Conteúdo para redes",
    description:
      "Posts patrocinados no Instagram, stories, reels e TikTok com foco em engajamento real.",
    tags: ["Marcas", "Editoras", "Autores"],
  },
  {
    title: "Clube de Leitura Corporativo",
    description:
      "Facilito encontros de leitura para empresas que queiram estimular a cultura literária internamente.",
    tags: ["Empresas"],
  },
  {
    title: "Envio de livros para resenha",
    description:
      "Envie seu livro para consideração de resenha orgânica. Sem garantia de publicação, sem taxas.",
    tags: ["Autores", "Editoras"],
  },
  {
    title: "Mídia Kit",
    description:
      "Dados de audiência, alcance, engajamento e formatos disponíveis. Solicite via e-mail.",
    tags: ["Mídia Kit"],
  },
];

export default function TrabalheComigoPage() {
  return (
    <>
      <PageHero
        eyebrow="Trabalhe Comigo"
        title="Vamos criar algo juntos."
        description="Parcerias que fazem sentido para o projeto e para a audiência. Transparência, relevância e leitores reais."
      />

      {/* Services */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="p-6 rounded-xl border border-[var(--bc-border)] bg-white flex flex-col gap-3"
              >
                <div>
                  <h3 className="font-bold text-[var(--bc-ink)] mb-2">{s.title}</h3>
                  <p className="text-sm text-[var(--bc-muted)] leading-relaxed">
                    {s.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {s.tags.map((tag) => (
                    <Badge key={tag} variant="muted">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 px-6 bg-[var(--bc-surface)]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-6 text-center">
            Princípios
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { title: "Honestidade", text: "Resenhas patrocinadas são claramente sinalizadas. A opinião é sempre a minha." },
              { title: "Relevância", text: "Só aceito parcerias com produtos ou serviços que fazem sentido para leitores." },
              { title: "Transparência", text: "Preços, formatos e entregas discutidos abertamente antes de qualquer acordo." },
            ].map((v) => (
              <div key={v.title} className="p-5">
                <h3 className="font-bold text-[var(--bc-ink)] mb-2">{v.title}</h3>
                <p className="text-sm text-[var(--bc-muted)] leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--bc-ink)] mb-4">
            Interessado em uma parceria?
          </h2>
          <p className="text-[var(--bc-muted)] mb-8 leading-relaxed">
            Entre em contato com detalhes do projeto, produto ou ideia. Responderei em até 5 dias úteis.
          </p>
          <Link href="/contato">
            <Button size="lg">Entrar em contato</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
