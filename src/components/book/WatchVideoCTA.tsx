import Link from "next/link";

interface WatchVideoCTAProps {
  hasVideoContent?: boolean;
  slug?: string;
}

/**
 * CTA visual mais forte que o `ContentBadge` — só aparece quando o livro
 * tem ao menos 1 conteúdo "com vídeo" (reel/short/youtube/vídeo, ver
 * `isVideoContentType`). Aponta para a seção de conteúdos da página do
 * livro (`#conteudos`, definida em `BookContentsSection`).
 */
export function WatchVideoCTA({ hasVideoContent, slug }: WatchVideoCTAProps) {
  if (!hasVideoContent || !slug) return null;

  return (
    <Link
      href={`/livro/${slug}#conteudos`}
      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold bg-[var(--bc-red)] text-white hover:bg-[var(--bc-red-dark)] transition-all duration-150 active:scale-[0.97] self-start"
    >
      ▶ Assistir vídeo
    </Link>
  );
}
