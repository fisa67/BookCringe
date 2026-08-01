export type CmsContentPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "podcast"
  | "blog"
  | "website";

export type CmsContentType =
  | "reel"
  | "short"
  | "video"
  | "podcast"
  | "article"
  | "other"
  | "youtube"
  | "carousel"
  | "review";

export interface CmsBookRecord {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  publication_year?: number;
  isbn?: string;
  page_count?: number;
  format?: string;
  language?: string;
  country?: string;
  genres: string[];
  amazon_url?: string;
  affiliate_url?: string;
  cover_path?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsBookCreate {
  slug: string;
  title: string;
  author: string;
  subtitle?: string;
  publisher?: string;
  publication_year?: number;
  isbn?: string;
  page_count?: number;
  format?: string;
  language?: string;
  country?: string;
  genres?: string[];
  amazon_url?: string;
  cover_path?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CmsBookUpdate extends Partial<CmsBookCreate> {
  id: string;
}

export interface CmsBookReadingRecord {
  id: string;
  book_id: string;
  rating?: number;
  review?: string;
  started_at?: string;
  finished_at?: string;
  status: string;
  format?: string;
  favorite: boolean;
  would_recommend: boolean;
  /** "Por que recomendo este livro" — exibido publicamente só quando favorite ou would_recommend também são true. */
  recommendation_reason?: string;
  /** Destaque "Recomendação do mês" em `/recomendacoes`. No máximo 1 `true` no site inteiro (índice único parcial no banco). */
  is_recommendation_of_month: boolean;
  /** Tempo total de leitura, em segundos. bigint no Postgres → serializado como string pelo Supabase-JS. */
  reading_time_seconds?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * `book_readings` com o livro relacionado embutido (via
 * `select("*, books(*)")` no Supabase-JS) — retorno de
 * `getFinishedReadingsWithBooks`. A chave usa o nome da tabela (`books`),
 * não o singular, pois é assim que o PostgREST nomeia o embed.
 */
export interface CmsFinishedReadingWithBook extends CmsBookReadingRecord {
  books: CmsBookRecord;
}

/**
 * Histórico editorial da "Recomendação do mês" (ver
 * `20260729_monthly_recommendations.sql`) — cada linha é um período em que
 * um livro ficou em destaque. `ended_at: null` = é a recomendação atual
 * (no máximo 1 por vez, índice único parcial no banco). Não confundir com
 * `book_readings.is_recommendation_of_month`, que continua sendo a única
 * fonte de verdade para o destaque atual nas páginas públicas — esta
 * tabela é só um log, mantido em sincronia por
 * `monthlyRecommendationService.syncRecommendationHistory`.
 */
export interface CmsMonthlyRecommendationRecord {
  id: string;
  book_reading_id: string;
  book_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

/**
 * `monthly_recommendations` com o livro relacionado embutido (via
 * `select("*, books(*)")`) — retorno de
 * `monthlyRecommendationService.getRecommendationHistory`, usado em
 * `/admin/recommendations`.
 */
export interface CmsMonthlyRecommendationWithBook extends CmsMonthlyRecommendationRecord {
  books: CmsBookRecord;
}

/**
 * Categoria editorial do conteúdo (`contents.content_category`). `"book"`
 * exige `book_id` (conteúdo sobre um livro específico); as demais são
 * conteúdo geral, sem livro associado — ver migration
 * `20260724_contents_general.sql`.
 */
export type CmsContentCategory =
  | "book"
  | "reading"
  | "productivity"
  | "community"
  | "opinion"
  | "other";

export interface CmsContentRecord {
  id: string;
  /** Opcional desde a Fase 2 do módulo Conteúdo — `null` para conteúdo geral (sem livro associado). */
  book_id: string | null;
  title?: string;
  platform: CmsContentPlatform;
  content_type: CmsContentType;
  content_category: CmsContentCategory;
  url: string;
  is_featured: boolean;
  published_at?: string;
  thumbnail_path?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsBookClubYearRecord {
  id: string;
  year: number;
  title?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsBookClubMonthRecord {
  id: string;
  year_id: string;
  month: number;
  theme?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsBookClubMonthBookRecord {
  id: string;
  month_id: string;
  book_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

/**
 * `books_read`/`pages_read`/`hours_read`/`authors_read`/`genres_read`/
 * `countries_read` deixaram de ser mantidos pelo app (ver
 * `completionService`) — `/estatisticas` recalcula tudo isso ao vivo a
 * partir de `book_readings` (`readingStatsPublicAdapter`), única fonte de
 * verdade para contadores de leitura. Este tipo reflete só as colunas que o
 * app ainda gerencia; as demais colunas legadas continuam fisicamente na
 * tabela (não foram dropadas), mas nenhum código deveria mais lê-las.
 */
export interface CmsStatisticsRecord {
  id: string;
  year: number;
  annual_goal: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsSettingsRecord {
  id: string;
  project_name: string;
  slogan?: string;
  email?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  spotify_url?: string;
  amazon_url?: string;
  amazon_associate_id?: string;
  goodreads_url?: string;
  threads_url?: string;
  logo_path?: string;
  favicon_path?: string;
  annual_goal: number;
  home_text?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Origem da inscrição no "Crew Literário" (ex-"Clube dos Leitores
 * BookCringe") — as 4 páginas com formulário embutido da Fase 2A
 * (`home`, `recommendations`, `book`, `contents`) mais a landing page
 * dedicada `/crew-literario` da Fase 3A (ver `20260724_newsletter_subscribers.sql`
 * e `20260727_crew_literario.sql`).
 */
export type NewsletterSource = "home" | "recommendations" | "book" | "contents" | "crew_literario";

export interface CmsNewsletterSubscriberRecord {
  id: string;
  email: string;
  source: NewsletterSource;
  /**
   * Preenchido por `confirmSubscriberByToken` quando o double opt-in é
   * concluído (Fase 3C) — `null`/ausente enquanto a confirmação está
   * pendente. Opcional (como `rating?`/`reading_time_seconds?` em
   * `CmsBookReadingRecord`) porque tem default `null` no banco — não
   * precisa ser informado no insert (`createSubscriber`).
   */
  confirmed_at?: string | null;
  /**
   * Token de confirmação pendente (double opt-in, Fase 3C) — `null` quando
   * não há confirmação em aberto. Após a confirmação, o token é preservado
   * para que acessos repetidos ao mesmo link sejam reconhecidos como "já
   * confirmado". Nunca deve ser exposto fora do backend (ex.: exportação CSV
   * do admin) — é um segredo enquanto válido.
   */
  confirmation_token?: string | null;
  /** Data/hora do último envio (ou reenvio) do e-mail de confirmação. */
  confirmation_sent_at?: string | null;
  created_at: string;
}

export interface CmsBookRatingRecord {
  id: string;
  book_id: string;
  subscriber_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Campanha de e-mail do Crew Literário (Fase 3B — ver
 * `20260727_newsletter_campaigns.sql`). `scheduled` está reservado para uma
 * futura Fase 3C (agendamento real); nenhum código escreve esse valor
 * ainda — só `draft` (criação/edição) e `sent` (via `markCampaignAsSent`).
 */
export type NewsletterCampaignStatus = "draft" | "scheduled" | "sent";

export interface CmsNewsletterCampaignRecord {
  id: string;
  /** Título interno — só aparece no admin, nunca no e-mail enviado. */
  title: string;
  /** Assunto do e-mail. */
  subject: string;
  /**
   * Corpo do e-mail. Campanhas novas/editadas guardam HTML sanitizado
   * produzido pelo Rich Text; campanhas antigas podem continuar em texto
   * puro e são convertidas sem perda ao abrir/renderizar.
   */
  content: string;
  status: NewsletterCampaignStatus;
  /** Quantos inscritos confirmados receberam o envio em massa — 0 até o status virar `sent`. */
  recipients_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PromotionalCampaignItemType = "book" | "kindle" | "accessory" | "other";

export interface CmsPromotionalCampaignRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Item de campanha promocional (`20260730_promotional_campaigns.sql`,
 * evoluído por `20260801_promotional_campaign_items_book_link.sql`). Duas
 * fontes de dados possíveis, mutuamente exclusivas (ver constraint
 * `promotional_campaign_items_source_check`):
 *   - `book_id` presente ("vinculado ao CMS"): `title`/`image_url`/
 *     `description`/`affiliate_url` são sempre `null` — os dados reais vêm
 *     da Biblioteca via join (`resolveCampaignItem`, `src/lib/campaigns.ts`).
 *   - `book_id` ausente ("manual"): os 4 campos acima são preenchidos à mão
 *     (produtos que não existem na Biblioteca — Kindle, acessórios etc.).
 *
 * `price` não duplica nada da Biblioteca (livros não têm preço cadastrado)
 * — é sempre um campo próprio da campanha, para os dois casos.
 */
export interface CmsPromotionalCampaignItemRecord {
  id: string;
  campaign_id: string;
  book_id: string | null;
  title: string | null;
  image_url: string | null;
  description: string | null;
  affiliate_url: string | null;
  price: number | null;
  position: number;
  is_active: boolean;
  item_type: PromotionalCampaignItemType;
  created_at: string;
  updated_at: string;
}

export interface CmsStoreCollectionRecord {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CmsStoreProductRecord {
  id: string;
  collection_id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  quantity: number;
  is_active: boolean;
  crew_exclusive: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CmsStoreInterestRecord {
  id: string;
  collection_id: string;
  product_id: string;
  name: string;
  email: string;
  message: string | null;
  created_at: string;
}

export interface CmsServiceResult<T> {
  data: T | null;
  error: string | null;
}
