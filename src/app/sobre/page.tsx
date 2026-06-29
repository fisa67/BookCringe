import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sobre",
  description: `Conheça a história por trás do ${SITE_NAME}, o projeto literário que acredita que livros podem (e devem) ser divertidos.`,
};

const timeline = [
  { year: "2022", text: "Primeiras resenhas publicadas nas redes sociais." },
  { year: "2023", text: "Canal no YouTube e TikTok ultrapassam 10 mil seguidores." },
  { year: "2024", text: "Lançamento do Clube de Leitura mensal." },
  { year: "2025", text: "Plataforma própria, dashboard de leituras e expansão do conteúdo." },
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre o BookCringe"
        title="Cringe por fora, cult por dentro."
        description="Um projeto que levou os livros a sério sem deixar de se divertir com eles."
      />

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Story */}
            <div className="prose prose-neutral max-w-none">
              <p className="text-[var(--bc-muted)] leading-relaxed text-lg mb-6">
                O BookCringe nasceu de uma necessidade simples: falar de livros
                de um jeito honesto, sem pedantismo, sem spoiler (quase sempre)
                e com um humor que às vezes vai longe demais.
              </p>
              <p className="text-[var(--bc-muted)] leading-relaxed mb-6">
                Acreditamos que a leitura não precisa ser sisuda. Um romance
                jovem adulto pode dividir espaço com Dostoiévski. Uma lista
                &ldquo;os livros mais constrangedores que já li&rdquo; pode ser
                tão válida quanto uma análise literária profunda.
              </p>
              <p className="text-[var(--bc-muted)] leading-relaxed mb-10">
                O resultado é uma plataforma que mistura estatísticas de leitura,
                resenhas, clube de leitura, vídeos e uma identidade que abraça o
                &ldquo;cringe&rdquo; como parte da experiência literária.
              </p>
              <Link href="/contato">
                <Button variant="outline">Entrar em contato</Button>
              </Link>
            </div>

            {/* Logo + Timeline */}
            <div className="flex flex-col gap-8">
              <div className="rounded-2xl border border-[var(--bc-border)] bg-white p-8 flex justify-center">
                <Image
                  src="/logo.png"
                  alt="BookCringe"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-4">
                  Linha do tempo
                </p>
                <div className="flex flex-col gap-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-sm font-bold text-[var(--bc-red)] w-10 shrink-0">
                        {item.year}
                      </span>
                      <p className="text-sm text-[var(--bc-muted)] leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-[var(--bc-surface)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-6 text-center">
            O que acreditamos
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Leitura sem julgamento",
                text: "Todo livro tem valor. Todo leitor tem seu ritmo. Não existe leitura errada.",
              },
              {
                title: "Honestidade acima de tudo",
                text: "Nossas resenhas são honestas, mesmo quando isso significa dar 2 estrelas para um clássico.",
              },
              {
                title: "Dados que importam",
                text: "Números revelam padrões. Sabemos exatamente o que lemos, de onde vieram os autores e o que ficou pelo caminho.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="p-6 rounded-xl bg-white border border-[var(--bc-border)]"
              >
                <h3 className="font-bold text-[var(--bc-ink)] mb-2">{v.title}</h3>
                <p className="text-sm text-[var(--bc-muted)] leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
