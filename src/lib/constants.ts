export const SITE_NAME = "BookCringe";
export const SITE_SLOGAN = "Cringe por fora, cult por dentro.";
export const SITE_DESCRIPTION =
  "BookCringe é uma marca brasileira de conteúdo literário que incentiva a leitura através de vídeos, resenhas, estatísticas, listas e clube de leitura.";
export const SITE_URL = "https://bookcringe.com.br";
export const SITE_AUTHOR = "BookCringe";
export const SITE_LOCALE = "pt_BR";
export const SITE_TWITTER = "@bookcringe";

export const NAV_LINKS = [
  { label: "Sobre", href: "/sobre" },
  { label: "Biblioteca", href: "/biblioteca" },
  { label: "Recomendações", href: "/recomendacoes" },
  { label: "Conteúdos", href: "/conteudos" },
  { label: "Clube de Leitura", href: "/clube-de-leitura" },
  { label: "Estatísticas", href: "/estatisticas" },
  { label: "Trabalhe Comigo", href: "/trabalhe-comigo" },
  { label: "Contato", href: "/contato" },
] as const;

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/bookcringe",
  youtube: "https://youtube.com/@bookcringe",
  tiktok: "https://tiktok.com/@bookcringe",
  spotify: "https://open.spotify.com/show/bookcringe",
} as const;

/**
 * Copy única do "Crew Literário" (rebrand do "Clube dos Leitores
 * BookCringe", Fase 3A) — reaproveitada pela landing page dedicada
 * (`/crew-literario`) e pelo CTA da Home (`NewsletterSection`), para nunca
 * divergir entre os dois pontos de entrada. Outras páginas com
 * `NewsletterCTA` (Recomendações, Livro, Conteúdos) usam sua própria copy
 * contextual, mas reaproveitam pelo menos `CREW_LITERARIO_TITLE`.
 */
export const CREW_LITERARIO_TITLE = "Junte-se ao Crew Literário 📚";
export const CREW_LITERARIO_TAGLINE = "Um e-mail de vez em quando. Boas recomendações sempre.";
export const CREW_LITERARIO_BENEFITS = [
  "Recomendações de leitura",
  "Curadoria BookCringe",
  "Bastidores das leituras",
  "Novos conteúdos",
  "Livros do mês",
] as const;
