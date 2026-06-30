import { STATUS_CONFIG, type BookStatus } from "@/lib/bookclub";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: BookStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        cfg.badgeBg,
        cfg.badgeText,
        cfg.badgeBorder,
        className
      )}
      aria-label={cfg.label}
    >
      <span role="img" aria-hidden="true">{cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}
