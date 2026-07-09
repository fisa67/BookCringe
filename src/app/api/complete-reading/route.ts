import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { finalizeBookReading } from "@/lib/services/completionService";

const requestSchema = z.object({
  bookId: z.string().uuid(),
  finishedAt: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  review: z.string().optional(),
  favorite: z.boolean().optional(),
  wouldRecommend: z.boolean().optional(),
  year: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const parseResult = requestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const result = await finalizeBookReading(parseResult.data);

  if (!result.reading) {
    return NextResponse.json(
      { error: "Não foi possível finalizar a leitura deste livro." },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
