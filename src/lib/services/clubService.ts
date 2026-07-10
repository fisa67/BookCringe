import type {
  CmsBookClubMonthBookRecord,
  CmsBookClubMonthRecord,
  CmsBookClubYearRecord,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const YEARS_TABLE = "bookclub_years";
const MONTHS_TABLE = "bookclub_months";
const MONTH_BOOKS_TABLE = "bookclub_month_books";

export async function getBookClubYears(): Promise<CmsBookClubYearRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    console.error("[clubService] getBookClubYears error", error);
    return null;
  }

  return data;
}

export async function getBookClubMonths(yearId: string): Promise<CmsBookClubMonthRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .select("*")
    .eq("year_id", yearId)
    .order("month", { ascending: true });

  if (error) {
    console.error("[clubService] getBookClubMonths error", error);
    return null;
  }

  return data;
}

export async function getBookClubMonthBooks(monthId: string): Promise<CmsBookClubMonthBookRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTH_BOOKS_TABLE)
    .select("*")
    .eq("month_id", monthId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[clubService] getBookClubMonthBooks error", error);
    return null;
  }

  return data;
}

export async function createBookClubYear(payload: Omit<CmsBookClubYearRecord, "id" | "created_at" | "updated_at">): Promise<CmsBookClubYearRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[clubService] createBookClubYear error", error);
    return null;
  }

  return data;
}

export async function createBookClubMonth(payload: Omit<CmsBookClubMonthRecord, "id" | "created_at" | "updated_at">): Promise<CmsBookClubMonthRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[clubService] createBookClubMonth error", error);
    return null;
  }

  return data;
}

export async function createBookClubMonthBook(payload: Omit<CmsBookClubMonthBookRecord, "id" | "created_at" | "updated_at">): Promise<CmsBookClubMonthBookRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTH_BOOKS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[clubService] createBookClubMonthBook error", error);
    return null;
  }

  return data;
}
