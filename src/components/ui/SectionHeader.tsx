import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-10",
        align === "center" && "text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--bc-ink)] tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[var(--bc-muted)] max-w-2xl leading-relaxed text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
