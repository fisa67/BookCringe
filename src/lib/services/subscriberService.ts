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

/** Lista inscritos do "Crew Literário" — usado por `/admin/subscribers` e pela exportação CSV. */
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

export interface SubscribersConfirmationCounts {
  confirmed: number;
  unconfirmed: number;
}

/**
 * Contagem de inscritos confirmados (`confirmed_at` preenchido) vs. não
 * confirmados (`confirmed_at` null) — usada em `/admin/subscribers` para
 * preparar o terreno de futuras campanhas segmentadas. Nesta fase, sem
 * double opt-in implementado, `confirmed` é sempre 0 (ver migration
 * `20260727_crew_literario.sql`); a contagem já funciona corretamente
 * assim que uma integração de envio passar a preencher `confirmed_at`.
 */
export async function getSubscribersConfirmationCounts(): Promise<SubscribersConfirmationCounts | null> {
  const { count: confirmed, error: confirmedError } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .not("confirmed_at", "is", null);

  const { count: unconfirmed, error: unconfirmedError } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .is("confirmed_at", null);

  if (confirmedError || unconfirmedError) {
    console.error(
      "[subscriberService] getSubscribersConfirmationCounts error",
      confirmedError ?? unconfirmedError
    );
    return null;
  }

  return { confirmed: confirmed ?? 0, unconfirmed: unconfirmed ?? 0 };
}

/**
 * E-mails elegíveis para envio em massa de campanhas (Fase 3B) —
 * `confirmed_at is not null`, a única lista que `campaignEmailService`
 * pode usar (ver migration `20260727_crew_literario.sql`). Como nenhum
 * registro tem `confirmed_at` preenchido ainda (sem double opt-in), esta
 * lista fica vazia até uma integração de confirmação existir — a regra já
 * fica pronta agora, mesmo sem uso real hoje.
 */
export async function getConfirmedSubscriberEmails(): Promise<string[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("email")
    .not("confirmed_at", "is", null);

  if (error) {
    console.error("[subscriberService] getConfirmedSubscriberEmails error", error);
    return null;
  }

  return data.map((row) => row.email);
}

export interface SubscribersGrowth {
  /** Novos inscritos nos últimos 30 dias (por `created_at`). */
  last30Days: number;
  totalCount: number;
  /** `last30Days / totalCount * 100`, 1 casa decimal — `null` quando `totalCount` é 0 (nada para calcular). */
  growthPct: number | null;
}

/**
 * Taxa simples de crescimento da base — proporção da base atual que entrou
 * nos últimos 30 dias. Usada no painel de `/admin/newsletters`. Deliberadamente
 * simples (sem comparar com o período anterior) — segmentação/analytics
 * avançados ficam para uma fase futura.
 */
export async function getSubscribersGrowth(): Promise<SubscribersGrowth | null> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalResult, recentResult] = await Promise.all([
    supabaseAdminClient.from(TABLE).select("*", { count: "exact", head: true }),
    supabaseAdminClient
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .gte("created_at", since.toISOString()),
  ]);

  if (totalResult.error || recentResult.error) {
    console.error(
      "[subscriberService] getSubscribersGrowth error",
      totalResult.error ?? recentResult.error
    );
    return null;
  }

  const totalCount = totalResult.count ?? 0;
  const last30Days = recentResult.count ?? 0;

  return {
    last30Days,
    totalCount,
    growthPct: totalCount > 0 ? Math.round((last30Days / totalCount) * 1000) / 10 : null,
  };
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
