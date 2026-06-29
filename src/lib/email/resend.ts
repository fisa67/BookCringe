import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const { RESEND_API_KEY } = getServerEnv();
    resendClient = new Resend(RESEND_API_KEY);
  }

  return resendClient;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
