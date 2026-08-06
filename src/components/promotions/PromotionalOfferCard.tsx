import Link from "next/link";
import type { ResolvedCampaignItem } from "@/lib/campaigns";
import { Badge } from "@/components/ui/Badge";
import { PROMOTIONAL_ITEM_TYPE_LABELS } from "@/lib/admin/promotionalCampaignLabels";

interface PromotionalOfferCardProps {
  item: ResolvedCampaignItem;
}

function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

/**
 * Card de oferta pública (`/ofertas`). Recebe um item já resolvido
 * (`resolveCampaignItem`) — nunca lê campos manuais diretamente, então
 * funciona igual para itens vinculados a um livro (capa/título/link vêm da
 * Biblioteca) e itens manuais (Kindle, acessórios etc.).
 */
export function PromotionalOfferCard({ item }: PromotionalOfferCardProps) {
  const price = formatPrice(item.price);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[var(--bc-border)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--bc-ink)]/20">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bc-surface)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">{PROMOTIONAL_ITEM_TYPE_LABELS[item.itemType]}</Badge>
        </div>
        <h2 className="line-clamp-2 text-base font-bold leading-tight text-[var(--bc-ink)]">
          {item.title}
        </h2>
        {item.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--bc-muted)]">
            {item.description}
          </p>
        ) : null}
        {price ? <p className="text-lg font-bold text-[var(--bc-ink)]">{price}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          {item.affiliateUrl ? (
            <a
              href={item.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-[var(--bc-red)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--bc-red)]/85 active:scale-[0.98]"
            >
              Ver oferta
            </a>
          ) : null}
          {item.bookHref ? (
            <Link
              href={item.bookHref}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--bc-border)] px-4 text-sm font-medium text-[var(--bc-ink)] transition hover:border-[var(--bc-ink)]/40"
            >
              Ver livro
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
