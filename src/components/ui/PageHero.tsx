import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function PageHero({ eyebrow, title, description, className }: PageHeroProps) {
  return (
    <section className={cn("pt-28 pb-12 px-6", className)}>
      <div className="max-w-6xl mx-auto">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight max-w-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-lg text-[var(--bc-muted)] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
