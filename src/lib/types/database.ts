import type {
  CmsBookRecord,
  CmsBookCreate,
  CmsBookUpdate,
  CmsBookReadingRecord,
  CmsContentRecord,
  CmsBookClubYearRecord,
  CmsBookClubMonthRecord,
  CmsBookClubMonthBookRecord,
  CmsStatisticsRecord,
  CmsSettingsRecord,
  CmsNewsletterSubscriberRecord,
  CmsBookRatingRecord,
  CmsNewsletterCampaignRecord,
  CmsMonthlyRecommendationRecord,
  CmsPromotionalCampaignRecord,
  CmsPromotionalCampaignItemRecord,
  CmsStoreCollectionRecord,
  CmsStoreProductRecord,
  CmsStoreInterestRecord,
} from "@/lib/types/cms";
import type {
  IntelligenceContentCreate,
  IntelligenceContentRecord,
  IntelligenceDatasetCreate,
  IntelligenceDatasetRecord,
  IntelligenceImportCreate,
  IntelligenceImportRecord,
  IntelligenceMetricCreate,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

/**
 * Tipagem do schema do Supabase (formato compatível com @supabase/supabase-js).
 *
 * Deriva os tipos de linha/insert/update a partir das interfaces já existentes
 * em `cms.ts`, sem inventar campos novos. Serve apenas para tipar o client
 * (`createClient<Database>`) e permitir `.from(tabela)` com inferência correta.
 * Não altera comportamento de runtime — generics são apenas compile-time.
 */

/**
 * Converte interfaces em forma de "type alias" (mapped type homomórfico).
 * Necessário porque interfaces não satisfazem `Record<string, unknown>`
 * (constraint exigida por `GenericTable` do @supabase/supabase-js).
 */
type Simplify<T> = { [K in keyof T]: T[K] };

type NewRow<T> = Omit<T, "id" | "created_at" | "updated_at">;
type NewRowWithUpdatedAt<T> = Omit<T, "id" | "created_at">;

interface TableShape<Row, Insert, Update> {
  Row: Simplify<Row>;
  Insert: Simplify<Insert>;
  Update: Simplify<Update>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      books: TableShape<CmsBookRecord, CmsBookCreate, CmsBookUpdate>;
      book_readings: TableShape<
        CmsBookReadingRecord,
        NewRow<CmsBookReadingRecord>,
        Partial<CmsBookReadingRecord>
      >;
      contents: TableShape<
        CmsContentRecord,
        NewRow<CmsContentRecord>,
        Partial<CmsContentRecord>
      >;
      bookclub_years: TableShape<
        CmsBookClubYearRecord,
        NewRow<CmsBookClubYearRecord>,
        Partial<CmsBookClubYearRecord>
      >;
      bookclub_months: TableShape<
        CmsBookClubMonthRecord,
        NewRow<CmsBookClubMonthRecord>,
        Partial<CmsBookClubMonthRecord>
      >;
      bookclub_month_books: TableShape<
        CmsBookClubMonthBookRecord,
        NewRow<CmsBookClubMonthBookRecord>,
        Partial<CmsBookClubMonthBookRecord>
      >;
      statistics: TableShape<
        CmsStatisticsRecord,
        Partial<CmsStatisticsRecord> & { year: number },
        Partial<CmsStatisticsRecord>
      >;
      settings: TableShape<
        CmsSettingsRecord,
        NewRow<CmsSettingsRecord>,
        Partial<CmsSettingsRecord>
      >;
      newsletter_subscribers: TableShape<
        CmsNewsletterSubscriberRecord,
        NewRow<CmsNewsletterSubscriberRecord>,
        Partial<CmsNewsletterSubscriberRecord>
      >;
      book_ratings: TableShape<
        CmsBookRatingRecord,
        NewRowWithUpdatedAt<CmsBookRatingRecord>,
        Partial<CmsBookRatingRecord>
      >;
      newsletter_campaigns: TableShape<
        CmsNewsletterCampaignRecord,
        NewRow<CmsNewsletterCampaignRecord>,
        Partial<CmsNewsletterCampaignRecord>
      >;
      monthly_recommendations: TableShape<
        CmsMonthlyRecommendationRecord,
        NewRow<CmsMonthlyRecommendationRecord>,
        Partial<CmsMonthlyRecommendationRecord>
      >;
      promotional_campaigns: TableShape<
        CmsPromotionalCampaignRecord,
        NewRow<CmsPromotionalCampaignRecord>,
        Partial<CmsPromotionalCampaignRecord>
      >;
      promotional_campaign_items: TableShape<
        CmsPromotionalCampaignItemRecord,
        NewRow<CmsPromotionalCampaignItemRecord>,
        Partial<CmsPromotionalCampaignItemRecord>
      >;
      store_collections: TableShape<
        CmsStoreCollectionRecord,
        NewRow<CmsStoreCollectionRecord>,
        Partial<CmsStoreCollectionRecord>
      >;
      store_products: TableShape<
        CmsStoreProductRecord,
        NewRow<CmsStoreProductRecord>,
        Partial<CmsStoreProductRecord>
      >;
      store_interests: TableShape<
        CmsStoreInterestRecord,
        NewRow<CmsStoreInterestRecord>,
        Partial<CmsStoreInterestRecord>
      >;
      intelligence_datasets: TableShape<
        IntelligenceDatasetRecord,
        IntelligenceDatasetCreate,
        Partial<IntelligenceDatasetRecord>
      >;
      intelligence_imports: TableShape<
        IntelligenceImportRecord,
        IntelligenceImportCreate,
        Partial<IntelligenceImportRecord>
      >;
      intelligence_contents: TableShape<
        IntelligenceContentRecord,
        IntelligenceContentCreate,
        Partial<IntelligenceContentRecord>
      >;
      intelligence_metrics: TableShape<
        IntelligenceMetricRecord,
        IntelligenceMetricCreate,
        Partial<IntelligenceMetricRecord>
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
