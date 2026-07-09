import type { CmsStatisticsRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "statistics";

export async function getStatisticsByYear(year: number): Promise<CmsStatisticsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from<CmsStatisticsRecord>(TABLE)
    .select("*")
    .eq("year", year)
    .single();

  if (error) {
    console.error("[statsService] getStatisticsByYear error", error);
    return null;
  }

  return data;
}

export async function createOrUpdateStatistics(payload: CmsStatisticsRecord): Promise<CmsStatisticsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from<CmsStatisticsRecord>(TABLE)
    .upsert(payload, { onConflict: ["year"] })
    .select()
    .single();

  if (error) {
    console.error("[statsService] createOrUpdateStatistics error", error);
    return null;
  }

  return data;
}
