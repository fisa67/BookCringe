import type { CmsStoreProductRecord } from "@/lib/types/cms";
import { Badge } from "@/components/ui/Badge";
import { StoreInterestButton } from "@/components/store/StoreInterestButton";

interface StoreProductCardProps {
  collectionName: string;
  product: CmsStoreProductRecord;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function StoreProductCard({ collectionName, product }: StoreProductCardProps) {
  const isSoldOut = product.quantity === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--bc-border)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--bc-ink)]/20">
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--bc-surface)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {product.crew_exclusive ? (
          <div className="absolute left-3 top-3">
            <Badge variant="red">Exclusivo do Crew</Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">Edição limitada</Badge>
          <Badge variant={isSoldOut ? "muted" : "default"}>
            {isSoldOut ? "Esgotado" : `${product.quantity} disponíveis`}
          </Badge>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-[var(--bc-ink)]">
          {product.name}
        </h3>
        {product.description ? (
          <p className="line-clamp-4 text-sm leading-relaxed text-[var(--bc-muted)]">
            {product.description}
          </p>
        ) : null}
        <p className="text-xl font-bold text-[var(--bc-ink)]">{formatPrice(product.price)}</p>
        <div className="mt-auto pt-2">
          <StoreInterestButton
            collectionId={product.collection_id}
            collectionName={collectionName}
            productId={product.id}
            productName={product.name}
          />
        </div>
      </div>
    </article>
  );
}
