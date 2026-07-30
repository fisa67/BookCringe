import { NextResponse } from "next/server";
import { getStoreInterests } from "@/lib/services/storeInterestService";

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const interests = await getStoreInterests({
    collectionId: searchParams.get("collection")?.trim() || undefined,
    productId: searchParams.get("product")?.trim() || undefined,
    from: searchParams.get("from")?.trim() || undefined,
    to: searchParams.get("to")?.trim() || undefined,
  });

  if (interests === null) {
    return NextResponse.json(
      { error: "Não foi possível gerar a exportação." },
      { status: 500 }
    );
  }

  const rows = [
    ["nome", "email", "produto", "colecao", "mensagem", "data"].join(","),
    ...interests.map((interest) =>
      [
        escapeCsvField(interest.name),
        escapeCsvField(interest.email),
        escapeCsvField(interest.productName),
        escapeCsvField(interest.collectionName),
        escapeCsvField(interest.message ?? ""),
        escapeCsvField(new Date(interest.created_at).toISOString()),
      ].join(",")
    ),
  ];

  const csv = `\uFEFF${rows.join("\n")}`;
  const filename = `interesses-bookcringe-store-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
