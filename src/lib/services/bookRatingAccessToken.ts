import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuthEnv } from "@/lib/env";

export const BOOK_RATING_ACCESS_COOKIE = "bc_crew_rating_access";
export const BOOK_RATING_ACCESS_TTL_SECONDS = 15 * 60;

function getSecret(): string {
  return getAuthEnv().AUTH_SECRET;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createBookRatingAccessToken(subscriberId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + BOOK_RATING_ACCESS_TTL_SECONDS;
  const payload = `${subscriberId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyBookRatingAccessToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [subscriberId, expiresAtRaw, receivedSignature] = parts;
  const payload = `${subscriberId}.${expiresAtRaw}`;
  const expectedSignature = sign(payload);

  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return subscriberId;
}
