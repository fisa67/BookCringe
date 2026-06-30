import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded bg-[var(--bc-border)] animate-pulse",
        className
      )}
      aria-hidden="true"
    />
  );
}

interface BookCardSkeletonProps {
  variant?: "vertical" | "horizontal";
  className?: string;
}

export function BookCardSkeleton({
  variant = "vertical",
  className,
}: BookCardSkeletonProps) {
  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "flex gap-4 rounded-xl border border-[var(--bc-border)] bg-white p-4",
          className
        )}
        role="status"
        aria-label="Carregando livro..."
      >
        <Shimmer className="w-16 aspect-[3/4] rounded-md shrink-0" />
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <Shimmer className="h-3.5 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
          <Shimmer className="h-6 w-24 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-[var(--bc-border)] bg-white overflow-hidden",
        className
      )}
      role="status"
      aria-label="Carregando livro..."
    >
      <Shimmer className="aspect-[3/4] w-full rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-3.5 w-4/5" />
          <Shimmer className="h-3 w-3/5" />
        </div>
        <Shimmer className="h-6 w-28" />
      </div>
    </div>
  );
}

/** Renders N skeleton cards in the same grid layout as the real list */
export function BookCardSkeletonGrid({
  count = 4,
  variant = "vertical",
}: {
  count?: number;
  variant?: "vertical" | "horizontal";
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <BookCardSkeleton key={i} variant={variant} />
      ))}
    </>
  );
}
