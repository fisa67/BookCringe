import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-4">
              Conteúdo literário
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--bc-ink)] tracking-tight leading-[1.05] mb-6">
              Book
              <span className="text-[var(--bc-red)]">Cringe.</span>
            </h1>
            <p className="text-xl text-[var(--bc-muted)] leading-relaxed mb-3 max-w-lg italic">
              &ldquo;Cringe por fora, cult por dentro.&rdquo;
            </p>
            <p className="text-base text-[var(--bc-muted)] leading-relaxed mb-10 max-w-md">
              Vídeos, resenhas, estatísticas, listas e clube de leitura para
              quem leva os livros a sério — mas não se leva tanto assim.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/biblioteca">
                <Button size="lg">Explorar biblioteca</Button>
              </Link>
              <a
                href="https://youtube.com/@bookcringe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Assistir vídeos
                </Button>
              </a>
            </div>
          </div>

          {/* Logo visual */}
          <div className="flex justify-center md:justify-end animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-white border border-[var(--bc-border)] flex items-center justify-center p-8">
                <Image
                  src="/logo.png"
                  alt="BookCringe — Cringe por fora, cult por dentro."
                  width={280}
                  height={280}
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
