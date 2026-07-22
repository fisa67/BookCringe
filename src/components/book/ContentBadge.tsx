import { Badge } from "@/components/ui/Badge";

interface ContentBadgeProps {
  count?: number;
}

/**
 * Indicador de conteúdo do `BookCard` (Biblioteca, Recomendações, Home):
 * "🎥 Tem vídeo" com exatamente 1 conteúdo, "🎥 N conteúdos" com mais de
 * um — sempre visível (não escondido no hover), o que também cobre o
 * pedido de indicador em Recomendações.
 */
export function ContentBadge({ count }: ContentBadgeProps) {
  if (!count || count <= 0) return null;

  return (
    <Badge variant="red" title={`${count} conteúdo${count === 1 ? "" : "s"} disponível${count === 1 ? "" : "is"}`}>
      🎥 {count === 1 ? "Tem vídeo" : `${count} conteúdos`}
    </Badge>
  );
}
