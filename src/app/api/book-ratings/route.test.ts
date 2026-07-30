import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getBookById: vi.fn(),
  saveBookRating: vi.fn(),
  getPublicBookRatingSummary: vi.fn(),
}));

vi.mock("@/lib/services/bookService", () => ({
  getBookById: mocks.getBookById,
}));

vi.mock("@/lib/services/bookRatingService", () => ({
  getPublicBookRatingSummary: mocks.getPublicBookRatingSummary,
  saveBookRating: mocks.saveBookRating,
}));

vi.mock("@/lib/services/bookRatingAccessToken", () => ({
  BOOK_RATING_ACCESS_COOKIE: "bc_crew_rating_access",
  verifyBookRatingAccessToken: vi.fn(() => "subscriber-1"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function ratingRequest() {
  return new Request("http://localhost/api/book-ratings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: "bc_crew_rating_access=signed-token",
    },
    body: JSON.stringify({
      bookId: "11111111-1111-4111-8111-111111111111",
      email: "leitora@example.com",
      rating: 5,
      comment: "Leitura marcante.",
    }),
  });
}

describe("POST /api/book-ratings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBookById.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      slug: "um-livro",
    });
    mocks.saveBookRating.mockResolvedValue({
      ok: true,
      rating: { id: "rating-1" },
    });
    mocks.getPublicBookRatingSummary.mockResolvedValue({
      average: 5,
      count: 1,
      ratings: [],
    });
  });

  it("salva a avaliação de um membro confirmado", async () => {
    const response = await POST(ratingRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      message: "✅ Avaliação salva com sucesso.",
      summary: { average: 5, count: 1 },
    });
    expect(mocks.saveBookRating).toHaveBeenCalledWith({
      bookId: "11111111-1111-4111-8111-111111111111",
      subscriberId: "subscriber-1",
      rating: 5,
      comment: "Leitura marcante.",
    });
  });

  it("bloqueia e-mails que não pertencem a assinantes confirmados", async () => {
    mocks.saveBookRating.mockResolvedValue({ ok: false, reason: "not-confirmed" });

    const response = await POST(ratingRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "Apenas membros confirmados do Crew Literário podem avaliar livros.",
    });
  });
});
