import type { CmsBookReadingRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "book_readings";

export async function getReadingByBook(bookId: string): Promise<CmsBookReadingRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    console.error("[bookReadingService] getReadingByBook error", error);
    return null;
  }

  return data;
}

export async function createReading(
  payload: Omit<CmsBookReadingRecord, "id" | "created_at" | "updated_at">
): Promise<CmsBookReadingRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[bookReadingService] createReading error", error);
    return null;
  }

  return data;
}

export async function updateReading(
  payload: Partial<CmsBookReadingRecord> & { id: string }
): Promise<CmsBookReadingRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update(payload)
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[bookReadingService] updateReading error", error);
    return null;
  }

  return data;
}

export async function saveReading(
  payload: Omit<CmsBookReadingRecord, "id" | "created_at" | "updated_at">
): Promise<CmsBookReadingRecord | null> {
  const existingReading = await getReadingByBook(payload.book_id);

  if (existingReading) {
    return updateReading({
      ...existingReading,
      ...payload,
    });
  }

  return createReading(payload);
}
