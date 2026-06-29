import Link from "next/link";
import Image from "next/image";
import { NAV_LINKS, SITE_SLOGAN, SOCIAL_LINKS } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-[var(--bc-border)] bg-[var(--bc-cream)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <Image src="/logo.png" alt="BookCringe" width={36} height={36} className="rounded" />
              <span className="font-bold text-[var(--bc-ink)] tracking-tight">
                Book<span className="text-[var(--bc-red)]">Cringe</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--bc-muted)] max-w-xs leading-relaxed italic">
              &ldquo;{SITE_SLOGAN}&rdquo;
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-4">
              Navegação
            </p>
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--bc-muted)] hover:text-[var(--bc-ink)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-muted)] mb-4">
              Redes sociais
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--bc-muted)] hover:text-[var(--bc-ink)] transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--bc-muted)] hover:text-[var(--bc-ink)] transition-colors"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--bc-muted)] hover:text-[var(--bc-ink)] transition-colors"
                >
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--bc-muted)] hover:text-[var(--bc-ink)] transition-colors"
                >
                  Spotify
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--bc-border)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[var(--bc-muted)]">
            © {currentYear} BookCringe. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[var(--bc-muted)]">
            Feito com amor por quem lê.
          </p>
        </div>
      </div>
    </footer>
  );
}
