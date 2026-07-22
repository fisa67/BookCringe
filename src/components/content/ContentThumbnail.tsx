import { cn } from "@/lib/utils";
import { CONTENT_TYPE_EMOJI } from "@/lib/content";
import type { CmsContentType } from "@/lib/types/cms";

interface ContentThumbnailProps {
  thumbnailPath?: string;
  title: string;
  contentType: CmsContentType;
  className?: string;
}

/**
 * Thumbnail de conteúdo (reel/short/vídeo/carrossel/review). Usa `<img>`
 * puro em vez de `next/image`: `thumbnail_path` aceita qualquer URL
 * externa informada manualmente no CMS (CDN do Instagram/TikTok/YouTube),
 * e cadastrar cada domínio possível em `images.remotePatterns`
 * (`next.config.ts`) não escala — mesmo trade-off documentado em
 * `BookCover`/`isDisplayableCoverPath`, mas aqui sem a lista de domínios
 * permitidos, já que a origem é mais variada.
 */
export function ContentThumbnail({ thumbnailPath, title, contentType, className }: ContentThumbnailProps) {
  return (
    <div
      className={cn(
        "relative w-full aspect-video overflow-hidden rounded-lg bg-[var(--bc-surface)]",
        className
      )}
    >
      {thumbnailPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailPath}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="text-3xl select-none">{CONTENT_TYPE_EMOJI[contentType]}</span>
        </div>
      )}
    </div>
  );
}
