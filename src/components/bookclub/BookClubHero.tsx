import Image from "next/image";
import type { BookClubEntry } from "@/lib/bookclub";
import { getFinishedBooks } from "@/lib/bookclub";

interface BookClubHeroProps {
  books: BookClubEntry[];
}

export function BookClubHero({ books }: BookClubHeroProps) {
  const finished = getFinishedBooks(books);
  const totalBooks = books.length;

  return (
    <section className="relative bg-[var(--bc-ink)] overflow-hidden pt-16">
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-5">
              Clube de Leitura · 2026
            </p>

            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Leia junto <br />
              <span className="text-[var(--bc-red)]">com a gente.</span>
            </h1>

            <ul className="space-y-2 mb-10" aria-label="O que o clube oferece">
              {[
                "Leia no seu ritmo.",
                "Converse sobre cada livro.",
                "Descubra novos autores.",
                "Faça parte da comunidade.",
              ].map((line) => (
                <li key={line} className="flex items-center gap-3 text-white/70 text-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--bc-red)] shrink-0" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-6 pt-6 border-t border-white/10">
              {[
                { value: totalBooks, label: "livros em 2026" },
                { value: finished.length, label: "já concluídos" },
                { value: "gratuito", label: "entrada livre" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — logo illustration */}
          <div
            className="flex justify-center md:justify-end animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="relative w-60 h-60 md:w-72 md:h-72">
              {/* Decorative ring */}
              <div
                className="absolute inset-0 rounded-full border border-white/10"
                aria-hidden="true"
              />
              <div
                className="absolute inset-4 rounded-full border border-white/5"
                aria-hidden="true"
              />
              {/* Logo card */}
              <div className="absolute inset-8 rounded-2xl bg-[var(--bc-cream)] flex items-center justify-center p-4">
                <Image
                  src="/logo.png"
                  alt="BookCringe"
                  width={180}
                  height={180}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
