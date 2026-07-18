import { cn } from "@/lib/utils";

export interface AffiliateDisclosureProps {
  className?: string;
}

/**
 * Disclosure obrigatório do Programa de Associados Amazon. Renderizado uma
 * vez por página que exibe links "Comprar na Amazon" (`BookCTA`/`BookCover`)
 * — não precisa ficar colado em cada link individual.
 */
export function AffiliateDisclosure({ className }: AffiliateDisclosureProps) {
  return (
    <p className={cn("text-center text-xs leading-relaxed text-[var(--bc-muted)]", className)}>
      📚 Gostou da indicação? Comprando por este link, você apoia o BookCringe e ajuda este projeto a
      continuar crescendo — sem pagar nada a mais por isso.
    </p>
  );
}
