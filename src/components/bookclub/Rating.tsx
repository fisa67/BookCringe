import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({ value, max = 5, size = "md", className }: RatingProps) {
  const sizeClass = { sm: "text-sm", md: "text-base", lg: "text-xl" }[size];

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(sizeClass, i < value ? "text-[var(--bc-red)]" : "text-[var(--bc-border)]")}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}
