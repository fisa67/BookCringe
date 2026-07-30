import { randomBytes } from "node:crypto";
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
  /** `true` = só confirmados, `false` = só pendentes (`confirmed_at` null), `undefined` = todos. */
  confirmed?: boolean;
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

  if (filters.confirmed === true) {
    query = query.not("confirmed_at", "is", null);
  } else if (filters.confirmed === false) {
    query = query.is("confirmed_at", null);
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
 * confirmados/pendentes (`confirmed_at` null) — usada em `/admin/subscribers`.
 * Desde a Fase 3C (double opt-in via `confirmSubscriberByToken`), reflete
 * confirmações reais.
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
 * pode usar. Desde a Fase 3C, populada por confirmações reais de double
 * opt-in (`confirmSubscriberByToken`).
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

/**
 * Gera o token de confirmação do double opt-in — 32 bytes aleatórios
 * criptograficamente seguros, codificados em hex (64 caracteres, 256 bits
 * de entropia: "difícil de adivinhar" na prática). Unicidade é garantida
 * pelo espaço de valores (2^256, colisão astronomicamente improvável) e
 * reforçada por um índice único parcial no banco
 * (`newsletter_subscribers_confirmation_token_key`, ver migration
 * `20260728_newsletter_double_optin.sql`).
 */
export function generateConfirmationToken(): string {
  return randomBytes(32).toString("hex");
}

/** Busca um inscrito pelo e-mail (normalizado) — usado por `createSubscriber` para decidir o que fazer em caso de e-mail duplicado. */
export async function getSubscriberByEmail(
  email: string
): Promise<CmsNewsletterSubscriberRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[subscriberService] getSubscriberByEmail error", error);
    return null;
  }

  return data;
}

export type CreateSubscriberResult =
  | { ok: true; subscriberStatus: "new" | "pending"; confirmationToken: string }
  | { ok: true; subscriberStatus: "confirmed" }
  | { ok: false; error: string };

/**
 * Cadastra um inscrito com double opt-in (Fase 3C): todo cadastro novo ou
 * pendente sai daqui com um `confirmation_token` recém-gerado — quem chama
 * (`/api/newsletter`) é responsável por enviar o e-mail de confirmação com
 * ele via `confirmationEmailService`. `confirmed_at` nunca é preenchido
 * aqui, só em `confirmSubscriberByToken`.
 *
 * Estados possíveis (`subscriberStatus`):
 *   - `"new"`: e-mail nunca visto antes — linha criada com token novo.
 *   - `"pending"`: e-mail já existia mas ainda não tinha confirmado — o
 *     token é regenerado e a confirmação é reenviada (evita a pessoa ficar
 *     travada se perdeu o primeiro e-mail).
 *   - `"confirmed"`: e-mail já confirmado — nada muda, nenhum e-mail novo
 *     é enviado (evita spam para quem já é do Crew).
 */
export async function createSubscriber(payload: {
  email: string;
  source: NewsletterSource;
}): Promise<CreateSubscriberResult> {
  const email = payload.email.trim().toLowerCase();
  const confirmationToken = generateConfirmationToken();
  const confirmationSentAt = new Date().toISOString();

  const { error } = await supabaseAdminClient.from(TABLE).insert({
    email,
    source: payload.source,
    confirmation_token: confirmationToken,
    confirmation_sent_at: confirmationSentAt,
  });

  if (!error) {
    return { ok: true, subscriberStatus: "new", confirmationToken };
  }

  if (error.code !== UNIQUE_VIOLATION) {
    console.error("[subscriberService] createSubscriber error", error);
    return {
      ok: false,
      error: "Não foi possível concluir sua inscrição agora. Tente novamente em instantes.",
    };
  }

  // E-mail já existe — decide o que fazer conforme o estado atual dele.
  const existing = await getSubscriberByEmail(email);

  if (!existing) {
    console.error(
      "[subscriberService] createSubscriber: violação de unicidade sem registro correspondente",
      { email }
    );
    return {
      ok: false,
      error: "Não foi possível concluir sua inscrição agora. Tente novamente em instantes.",
    };
  }

  if (existing.confirmed_at) {
    return { ok: true, subscriberStatus: "confirmed" };
  }

  const { error: updateError } = await supabaseAdminClient
    .from(TABLE)
    .update({ confirmation_token: confirmationToken, confirmation_sent_at: confirmationSentAt })
    .eq("id", existing.id);

  if (updateError) {
    console.error("[subscriberService] createSubscriber: falha ao reenviar confirmação", updateError);
    return {
      ok: false,
      error: "Não foi possível concluir sua inscrição agora. Tente novamente em instantes.",
    };
  }

  return { ok: true, subscriberStatus: "pending", confirmationToken };
}

export type ConfirmSubscriberResult =
  | { ok: true; email: string; alreadyConfirmed: boolean }
  | { ok: false; error: string };

/**
 * Confirma um inscrito a partir do token recebido em
 * `/crew-literario/confirmar?token=...`: valida o token, preenche
 * `confirmed_at` e preserva o `confirmation_token` para que acessos
 * repetidos ao mesmo link sejam reconhecidos como "já confirmado".
 *
 * A atualização condicional em `confirmed_at is null` também torna a
 * transição segura quando duas requisições chegam quase ao mesmo tempo:
 * apenas a primeira envia o welcome; as demais recebem
 * `alreadyConfirmed: true`.
 */
export async function confirmSubscriberByToken(token: string): Promise<ConfirmSubscriberResult> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("id, email, confirmed_at")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error) {
    console.error("[subscriberService] confirmSubscriberByToken error", error);
    return {
      ok: false,
      error: "Não foi possível confirmar seu e-mail agora. Tente novamente em instantes.",
    };
  }

  if (!data) {
    return { ok: false, error: "Link de confirmação inválido ou já utilizado." };
  }

  if (data.confirmed_at) {
    return { ok: true, email: data.email, alreadyConfirmed: true };
  }

  const { data: confirmedData, error: updateError } = await supabaseAdminClient
    .from(TABLE)
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("confirmed_at", null)
    .select("id, email, confirmed_at")
    .maybeSingle();
  // Só a requisição que ainda encontra confirmed_at nulo pode efetivar a
  // transição pendente → confirmado.

  if (updateError) {
    console.error("[subscriberService] confirmSubscriberByToken update error", updateError);
    return {
      ok: false,
      error: "Não foi possível confirmar seu e-mail agora. Tente novamente em instantes.",
    };
  }

  if (confirmedData) {
    return { ok: true, email: data.email, alreadyConfirmed: false };
  }

  // Outra requisição pode ter confirmado o mesmo token entre o SELECT e o
  // UPDATE. Como o token foi preservado, conseguimos distinguir essa corrida
  // de um token inexistente.
  const { data: current, error: currentError } = await supabaseAdminClient
    .from(TABLE)
    .select("email, confirmed_at")
    .eq("id", data.id)
    .maybeSingle();

  if (currentError) {
    console.error("[subscriberService] confirmSubscriberByToken reread error", currentError);
    return {
      ok: false,
      error: "Não foi possível confirmar seu e-mail agora. Tente novamente em alguns instantes.",
    };
  }

  if (current?.confirmed_at) {
    return { ok: true, email: current.email, alreadyConfirmed: true };
  }

  return {
    ok: false,
    error: "Não foi possível confirmar seu e-mail agora. Tente novamente em alguns instantes.",
  };
}

/**
 * Confirma manualmente um assinante pendente — usado pelo botão "✅ Confirmar"
 * do admin para leitores antigos ou conhecidos. A confirmação manual também
 * preserva um token existente para que um clique posterior no e-mail seja
 * reconhecido como "já confirmado".
 */
export type ConfirmSubscriberManuallyResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * A confirmação manual mantém o token pendente no registro. Assim, se o
 * assinante também abrir o e-mail que recebeu, o link será reconhecido como
 * já confirmado em vez de parecer inválido.
 */
export async function confirmSubscriberManually(id: string): Promise<ConfirmSubscriberManuallyResult> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("id, email, confirmed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[subscriberService] confirmSubscriberManually lookup error", error);
    return { ok: false, error: "Não foi possível localizar o assinante." };
  }

  if (!data) {
    return { ok: false, error: "Assinante não encontrado." };
  }

  if (data.confirmed_at) {
    return { ok: false, error: "Este assinante já está confirmado." };
  }

  const { error: updateError } = await supabaseAdminClient
    .from(TABLE)
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error("[subscriberService] confirmSubscriberManually update error", updateError);
    return { ok: false, error: "Não foi possível confirmar o assinante. Tente novamente." };
  }

  return { ok: true, email: data.email };
}

/**
 * Exclui um assinante — usado pelo admin (`/admin/subscribers`) para
 * resolver o caso mais comum de "e-mail digitado errado" sem precisar abrir
 * o Supabase. Exclusão individual só (nenhum caller faz exclusão em lote
 * nesta fase); `newsletter_subscribers` não tem nenhuma tabela dependente
 * via FK, então é um delete direto, sem soft-delete.
 */
export async function deleteSubscriber(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("[subscriberService] deleteSubscriber error", error);
    return false;
  }

  return true;
}

export type RegenerateConfirmationTokenResult =
  | { ok: true; email: string; confirmationToken: string }
  | { ok: false; error: string };

/**
 * Gera um novo `confirmation_token` (e atualiza `confirmation_sent_at`)
 * para um assinante pendente — usado pelo botão "Reenviar confirmação" do
 * admin, para quem perdeu o e-mail original. Quem chama ainda precisa
 * enviar o e-mail de verdade com `confirmationEmailService.sendConfirmationEmail`
 * (esta função só cuida do token/banco, mesma separação de
 * `createSubscriber`/`sendConfirmationEmail` em `/api/newsletter`).
 *
 * Defesa em profundidade: recusa se o assinante já estiver confirmado
 * (`confirmed_at` preenchido) — mesmo que a UI já esconda o botão nesse
 * caso, esta função nunca deveria enviar uma nova confirmação, nem alterar
 * `confirmed_at`, para quem já é do Crew.
 */
export async function regenerateConfirmationToken(
  id: string
): Promise<RegenerateConfirmationTokenResult> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("id, email, confirmed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[subscriberService] regenerateConfirmationToken lookup error", error);
    return { ok: false, error: "Não foi possível localizar o assinante." };
  }

  if (!data) {
    return { ok: false, error: "Assinante não encontrado." };
  }

  if (data.confirmed_at) {
    return { ok: false, error: "Este assinante já confirmou o e-mail — nada a reenviar." };
  }

  const confirmationToken = generateConfirmationToken();
  const confirmationSentAt = new Date().toISOString();

  const { error: updateError } = await supabaseAdminClient
    .from(TABLE)
    .update({ confirmation_token: confirmationToken, confirmation_sent_at: confirmationSentAt })
    .eq("id", id);

  if (updateError) {
    console.error("[subscriberService] regenerateConfirmationToken update error", updateError);
    return { ok: false, error: "Não foi possível gerar um novo link de confirmação." };
  }

  return { ok: true, email: data.email, confirmationToken };
}
