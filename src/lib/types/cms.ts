export type CmsContentPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "podcast"
  | "blog";

export type CmsContentType = "reel" | "short" | "video" | "podcast" | "article" | "other";

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
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsContentRecord {
  id: string;
  book_id: string;
  platform: CmsContentPlatform;
  content_type: CmsContentType;
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

export interface CmsStatisticsRecord {
  id: string;
  year: number;
  annual_goal: number;
  books_read: number;
  pages_read: number;
  hours_read: number;
  authors_read: number;
  genres_read: number;
  countries_read: number;
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

export interface CmsServiceResult<T> {
  data: T | null;
  error: string | null;
}
