/**
 * POST /api/bookclub
 *
 * Recebe inscrições do Clube de Leitura e:
 *  1. Valida os dados com Zod
 *  2. Verifica honeypot anti-bot
 *  3. Verifica Cloudflare Turnstile (se configurado)
 *  4. Aplica rate-limit por IP
 *  5. Sanitiza campos livres
 *  6. Envia para Google Sheets via Apps Script webhook
 *  7. Envia e-mail de notificação para o administrador (Resend)
 *  8. Envia e-mail de boas-vindas para o inscrito (Resend, se contato for e-mail)
 *
 * ──────────────────────────────────────────────────────────
 * GOOGLE APPS SCRIPT — como configurar:
 *
 * 1. Abra sheets.google.com e crie uma planilha com as colunas:
 *    Data | Nome | Contato | Plataforma | Perfil | Interesses | Mensagem | Encontros | Avisar
 *
 * 2. Em Extensões → Apps Script, cole o código abaixo e salve:
 *
 *    function doPost(e) {
 *      const data = JSON.parse(e.postData.contents);
 *      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *      sheet.appendRow([
 *        new Date().toLocaleString('pt-BR'),
 *        data.name, data.contact, data.platform,
 *        data.readingProfile, data.interests,
 *        data.message || '', data.monthlyMeetings ? 'Sim' : 'Não',
 *        data.canNotify ? 'Sim' : 'Não',
 *      ]);
 *      return ContentService
 *        .createTextOutput(JSON.stringify({ success: true }))
 *        .setMimeType(ContentService.MimeType.JSON);
 *    }
 *
 * 3. Em Implantar → Nova implantação:
 *    - Tipo: App da Web
 *    - Executar como: Eu mesmo
 *    - Quem tem acesso: Qualquer pessoa
 *    - Copie a URL gerada para GOOGLE_SCRIPT_WEBHOOK_URL no .env
 * ──────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { sanitize, isEmail, PLATFORM_LABELS, READING_PROFILE_LABELS } from "@/lib/bookclub";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "contato@bookcringe.com.br";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "BookCringe <noreply@bookcringe.com.br>";

// ─────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────

const registrationSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100),
  contact: z
    .string()
    .min(3, "Informe um e-mail ou WhatsApp.")
    .max(200),
  platform: z.enum(["instagram", "youtube", "tiktok", "all"]),
  readingProfile: z.enum(["casual", "frequent", "booktuber", "returning"]),
  interests: z
    .string()
    .min(5, "Interesses muito curtos.")
    .max(1000),
  message: z.string().max(2000).optional().or(z.literal("")),
  monthlyMeetings: z.boolean(),
  canNotify: z.boolean(),
  turnstileToken: z.string().optional(),
  _hp: z
    .string()
    .max(0, "Honeypot triggered.")
    .optional(),
});

type Registration = z.infer<typeof registrationSchema>;

// ─────────────────────────────────────────────
// Rate limiter (in-memory; swap for Redis/Upstash in production)
// ─────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;

  record.count += 1;
  return true;
}

// ─────────────────────────────────────────────
// Cloudflare Turnstile verification
// ─────────────────────────────────────────────

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) return true; // skip if not configured

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip,
  });

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body }
  );

  const json = (await res.json()) as { success: boolean };
  return json.success === true;
}

// ─────────────────────────────────────────────
// Google Sheets via Apps Script webhook
// ─────────────────────────────────────────────

async function sendToGoogleSheets(data: Registration): Promise<void> {
  const url = process.env.GOOGLE_SCRIPT_WEBHOOK_URL;
  if (!url) return; // skip if not configured

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      contact: data.contact,
      platform: PLATFORM_LABELS[data.platform],
      readingProfile: READING_PROFILE_LABELS[data.readingProfile],
      interests: data.interests,
      message: data.message ?? "",
      monthlyMeetings: data.monthlyMeetings,
      canNotify: data.canNotify,
    }),
  });
}

// ─────────────────────────────────────────────
// E-mail templates
// ─────────────────────────────────────────────

function adminEmailHtml(data: Registration): string {
  const rows = [
    ["Nome", data.name],
    ["Contato", data.contact],
    ["Plataforma preferida", PLATFORM_LABELS[data.platform]],
    ["Perfil de leitor", READING_PROFILE_LABELS[data.readingProfile]],
    ["O que procura no clube", data.interests],
    ["Mensagem", data.message ?? "—"],
    ["Encontros mensais", data.monthlyMeetings ? "Sim" : "Não"],
    ["Pode avisar", data.canNotify ? "Sim" : "Não"],
    ["Data/hora", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;background:#F7F3EC;font-size:12px;font-weight:600;color:#6B6B6B;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;border-bottom:1px solid #E5E0D8;">${label}</td>
          <td style="padding:8px 12px;font-size:14px;color:#1A1A1A;border-bottom:1px solid #E5E0D8;">${String(value).replace(/</g, "&lt;")}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #E5E0D8;overflow:hidden;">
    <tr>
      <td style="background:#1A1A1A;padding:24px 32px;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#E8302A;">BookCringe</p>
        <h1 style="margin:4px 0 0;font-size:20px;color:#fff;font-weight:700;">📚 Nova inscrição no Clube de Leitura</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E0D8;border-radius:8px;overflow:hidden;">${rows}</table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid #E5E0D8;">
        <p style="margin:0;font-size:12px;color:#6B6B6B;">Enviado automaticamente pelo BookCringe · bookcringe.com.br</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #E5E0D8;overflow:hidden;">
    <tr>
      <td style="background:#1A1A1A;padding:24px 32px;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#E8302A;">BookCringe</p>
        <p style="margin:4px 0 0;font-size:13px;color:#ffffff80;font-style:italic;">Cringe por fora, cult por dentro.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:24px;color:#1A1A1A;font-weight:700;letter-spacing:-.02em;">Bem-vindo ao Clube, ${name.split(" ")[0]}! 📚</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#6B6B6B;line-height:1.6;">
          Sua inscrição no <strong style="color:#1A1A1A;">Clube de Leitura BookCringe</strong> foi recebida com sucesso.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#6B6B6B;line-height:1.6;">
          Aqui a leitura é levada a sério, mas sem deixar o humor de lado. Estamos
          felizes que você topou embarcar nessa.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#6B6B6B;line-height:1.6;">
          Em breve você receberá informações sobre os próximos encontros, os livros
          escolhidos e tudo que acontece no clube.
        </p>
        <a href="https://bookcringe.com.br/clube-de-leitura" style="display:inline-block;padding:12px 24px;background:#E8302A;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
          Ver o calendário de leitura
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid #E5E0D8;">
        <p style="margin:0;font-size:12px;color:#6B6B6B;">
          BookCringe · <a href="https://bookcringe.com.br" style="color:#E8302A;text-decoration:none;">bookcringe.com.br</a>
          · Você recebeu este e-mail porque se inscreveu no Clube de Leitura.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Resend: send both e-mails
// ─────────────────────────────────────────────

async function sendEmails(data: Registration): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // skip if not configured

  const resend = new Resend(apiKey);

  const tasks: Promise<unknown>[] = [
    resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: "📚 Nova inscrição no Clube de Leitura",
      html: adminEmailHtml(data),
    }),
  ];

  // Welcome e-mail only when contact is an e-mail address
  if (isEmail(data.contact)) {
    tasks.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: data.contact.trim(),
        subject: "Bem-vindo ao Clube de Leitura BookCringe 📚",
        html: welcomeEmailHtml(data.name),
      })
    );
  }

  await Promise.allSettled(tasks);
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Get client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // ── 2. Rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em 1 hora." },
      { status: 429 }
    );
  }

  // ── 3. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  // ── 4. Validate with Zod
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const data = parsed.data;

  // ── 5. Honeypot check
  if (data._hp && data._hp.length > 0) {
    // Return 200 to fool bots while silently discarding
    return NextResponse.json({ success: true });
  }

  // ── 6. Turnstile verification
  if (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    const token = data.turnstileToken ?? "";
    const valid = await verifyTurnstile(token, ip);
    if (!valid) {
      return NextResponse.json(
        { error: "Verificação de segurança falhou. Recarregue e tente novamente." },
        { status: 403 }
      );
    }
  }

  // ── 7. Sanitize free-text fields
  const clean: Registration = {
    ...data,
    name: sanitize(data.name, 100),
    contact: sanitize(data.contact, 200),
    interests: sanitize(data.interests, 1000),
    message: data.message ? sanitize(data.message, 2000) : undefined,
  };

  // ── 8. Side effects (non-blocking — failures don't reject the response)
  await Promise.allSettled([sendToGoogleSheets(clean), sendEmails(clean)]);

  return NextResponse.json({ success: true }, { status: 200 });
}
