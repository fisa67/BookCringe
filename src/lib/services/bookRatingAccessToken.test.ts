import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBookRatingAccessToken,
  verifyBookRatingAccessToken,
} from "./bookRatingAccessToken";

describe("bookRatingAccessToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("assina e valida o acesso do assinante", () => {
    vi.stubEnv("AUTH_SECRET", "rating-test-secret");
    vi.stubEnv("AUTH_GITHUB_ID", "github-id");
    vi.stubEnv("AUTH_GITHUB_SECRET", "github-secret");
    vi.stubEnv("ADMIN_GITHUB_LOGIN", "admin");

    const token = createBookRatingAccessToken("subscriber-1");

    expect(verifyBookRatingAccessToken(token)).toBe("subscriber-1");
    expect(verifyBookRatingAccessToken(`${token}tampered`)).toBeNull();
  });
});
