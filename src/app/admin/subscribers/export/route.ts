import { NextResponse } from "next/server";
import { getSubscribers } from "@/lib/services/subscriberService";
import { NEWSLETTER_SOURCES } from "@/lib/validations/newsletter";
import { NEWSLETTER_SOURCE_LABELS } from "@/lib/admin/subscriberLabels";
import type { NewsletterSource } from "@/lib/types/cms";

/**
 * Exportação CSV dos assinantes do "Crew Literário" —
 * `/admin/subscribers`. Rota dentro de `/admin/*`, então já protegida pelo
 * mesmo proxy de sessão (`src/proxy.ts`, matcher `/admin/:path*`) usado
 * pelo resto do painel — nenhuma checagem de auth adicional necessária
 * aqui. Aceita os mesmos filtros da listagem (`search`, `source`, `sort`,
 * `confirmed`) para exportar exatamente o que está sendo visto na tela.
 * Nunca inclui `confirmation_token` (segredo enquanto válido) — só as
 * colunas públicas do painel.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || undefined;
  const sourceParam = searchParams.get("source") ?? undefined;
  const source = NEWSLETTER_SOURCES.find((value) => value === sourceParam) as NewsletterSource | undefined;
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "recent";
  const confirmedParam = searchParams.get("confirmed");
  const confirmed = confirmedParam === "confirmed" ? true : confirmedParam === "pending" ? false : undefined;

  const subscribers = await getSubscribers({ search, source, sort, confirmed });

  if (subscribers === null) {
    return NextResponse.json({ error: "Não foi possível gerar a exportação." }, { status: 500 });
  }

  const escapeCsvField = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const rows = [
    ["email", "origem", "confirmado", "data_cadastro"].join(","),
    ...subscribers.map((subscriber) =>
      [
        escapeCsvField(subscriber.email),
        escapeCsvField(NEWSLETTER_SOURCE_LABELS[subscriber.source]),
        escapeCsvField(subscriber.confirmed_at ? "sim" : "não"),
        escapeCsvField(new Date(subscriber.created_at).toISOString()),
      ].join(",")
    ),
  ];

  // BOM UTF-8 — evita acentos quebrados ao abrir o CSV direto no Excel.
  const csv = "\uFEFF" + rows.join("\n");
  const filename = `assinantes-bookcringe-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
