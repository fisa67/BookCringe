import type { CmsStatisticsRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "statistics";

export async function getStatisticsCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[statsService] getStatisticsCount error", error);
    return null;
  }

  return count;
}

export async function getStatisticsByYear(year: number): Promise<CmsStatisticsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("year", year)
    .single();

  if (error) {
    console.error("[statsService] getStatisticsByYear error", error);
    return null;
  }

  return data;
}

export async function createOrUpdateStatistics(payload: Partial<CmsStatisticsRecord> & { year: number }): Promise<CmsStatisticsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .upsert(
      {
        ...payload,
        metadata: payload.metadata ?? {},
      },
      { onConflict: "year" }
    )
    .select()
    .single();

  if (error) {
    console.error("[statsService] createOrUpdateStatistics error", error);
    return null;
  }

  return data;
}
