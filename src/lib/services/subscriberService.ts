import type { CmsNewsletterSubscriberRecord, NewsletterSource } from "@/lib/types/cms";
import { NEWSLETTER_SOURCES } from "@/lib/validations/newsletter";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "newsletter_subscribers";

/** Código Postgres de violação de unicidade — usado para tratar e-mail duplicado como sucesso (idempotente). */
const UNIQUE_VIOLATION = "23505";

export type GetSubscribersSort = "recent" | "oldest";

export interface GetSubscribersFilters {
  /** Busca parcial, case-insensitive, no e-mail. */
  search?: string;
  source?: NewsletterSource;
  sort?: GetSubscribersSort;
}

/** Lista inscritos do "Clube dos Leitores BookCringe" — usado por `/admin/subscribers` e pela exportação CSV. */
export async function getSubscribers(
  filters: GetSubscribersFilters = {}
): Promise<CmsNewsletterSubscriberRecord[] | null> {
  let query = supabaseAdminClient.from(TABLE).select("*");

  if (filters.search) {
    query = query.ilike("email", `%${filters.search}%`);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  query = query.order("created_at", { ascending: filters.sort === "oldest" });

  const { data, error } = await query;

  if (error) {
    console.error("[subscriberService] getSubscribers error", error);
    return null;
  }

  return data;
}

export async function getSubscribersCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[subscriberService] getSubscribersCount error", error);
    return null;
  }

  return count;
}

export interface SubscribersCountBySource {
  source: NewsletterSource;
  count: number;
}

/**
 * Contagem de inscritos por origem — inclui as 4 origens com `count: 0`
 * mesmo sem nenhum inscrito ainda, para o painel de analytics do CMS não
 * precisar tratar ausência de linha.
 */
export async function getSubscribersCountBySource(): Promise<SubscribersCountBySource[] | null> {
  const { data, error } = await supabaseAdminClient.from(TABLE).select("source");

  if (error) {
    console.error("[subscriberService] getSubscribersCountBySource error", error);
    return null;
  }

  const counts = new Map<NewsletterSource, number>();
  for (const row of data) {
    counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
  }

  return NEWSLETTER_SOURCES.map((source) => ({ source, count: counts.get(source) ?? 0 }));
}

export type CreateSubscriberResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

/**
 * Cadastra um inscrito. E-mail duplicado (constraint `lower(email)`, ver
 * migration `20260724_newsletter_subscribers.sql`) é tratado como sucesso
 * idempotente — quem já é do Clube não deve ver mensagem de erro ao
 * tentar entrar de novo por outra página.
 */
export async function createSubscriber(payload: {
  email: string;
  source: NewsletterSource;
}): Promise<CreateSubscriberResult> {
  const email = payload.email.trim().toLowerCase();

  const { error } = await supabaseAdminClient.from(TABLE).insert({ email, source: payload.source });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: true, alreadySubscribed: true };
    }

    console.error("[subscriberService] createSubscriber error", error);
    return {
      ok: false,
      error: "Não foi possível concluir sua inscrição agora. Tente novamente em instantes.",
    };
  }

  return { ok: true, alreadySubscribed: false };
}
