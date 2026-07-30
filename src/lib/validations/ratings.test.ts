import { describe, expect, it } from "vitest";
import { bookRatingFormSchema } from "./ratings";

const validRating = {
  bookId: "11111111-1111-4111-8111-111111111111",
  email: "leitora@example.com",
  rating: 5,
};

describe("bookRatingFormSchema", () => {
  it("aceita nota válida com comentário opcional", () => {
    const result = bookRatingFormSchema.safeParse({
      ...validRating,
      comment: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeUndefined();
    }
  });

  it("rejeita notas fora da escala e comentários longos", () => {
    expect(
      bookRatingFormSchema.safeParse({ ...validRating, rating: 6 }).success
    ).toBe(false);
    expect(
      bookRatingFormSchema.safeParse({ ...validRating, comment: "a".repeat(501) }).success
    ).toBe(false);
  });
});
