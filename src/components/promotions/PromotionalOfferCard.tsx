import type { CmsPromotionalCampaignItemRecord } from "@/lib/types/cms";
import { Badge } from "@/components/ui/Badge";
import { PROMOTIONAL_ITEM_TYPE_LABELS } from "@/lib/admin/promotionalCampaignLabels";

interface PromotionalOfferCardProps {
  item: CmsPromotionalCampaignItemRecord;
}

function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function PromotionalOfferCard({ item }: PromotionalOfferCardProps) {
  const price = formatPrice(item.price);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[var(--bc-border)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--bc-ink)]/20">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bc-surface)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">{PROMOTIONAL_ITEM_TYPE_LABELS[item.item_type]}</Badge>
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
        <a
          href={item.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-auto inline-flex h-10 items-center justify-center rounded-md bg-[var(--bc-red)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--bc-red)]/85 active:scale-[0.98]"
        >
          Ver oferta
        </a>
      </div>
    </article>
  );
}
