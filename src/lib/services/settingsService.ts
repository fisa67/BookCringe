import type { CmsSettingsRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "settings";

export async function getSettings(): Promise<CmsSettingsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[settingsService] getSettings error", error);
    return null;
  }

  return data;
}

export async function getOrCreateSettings(): Promise<CmsSettingsRecord | null> {
  const settings = await getSettings();
  if (settings) {
    return settings;
  }

  return createDefaultSettings();
}

export async function createDefaultSettings(): Promise<CmsSettingsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert({
      project_name: "BookCringe",
      annual_goal: 52,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    console.error("[settingsService] createDefaultSettings error", error);
    return null;
  }

  return data;
}

export async function updateSettings(
  payload: Partial<CmsSettingsRecord> & { id: string }
): Promise<CmsSettingsRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update({ ...payload })
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[settingsService] updateSettings error", error);
    return null;
  }

  return data;
}
