import { SITE_NAME } from "@/lib/constants";
import { getFromEmail, getServerEnv } from "@/lib/env";
import { escapeHtml, getResendClient } from "@/lib/email/resend";
import {
  contactSubjectLabels,
  formTypeLabels,
  partnershipTypeLabels,
  type FormSubmission,
} from "@/lib/validations/forms";

function buildInternalDetails(data: FormSubmission): string {
  const lines = [
    `Nome: ${data.name}`,
    `E-mail: ${data.email}`,
  ];

  if (data.formType === "contato") {
    lines.push(`Assunto: ${contactSubjectLabels[data.subject]}`);
  }

  if (data.formType === "trabalhe-comigo") {
    if (data.company) {
      lines.push(`Empresa: ${data.company}`);
    }
    lines.push(`Tipo de parceria: ${partnershipTypeLabels[data.type]}`);
  }

  lines.push("", "Mensagem:", data.message);

  return lines.join("\n");
}

function buildInternalHtml(data: FormSubmission): string {
  const details: string[] = [
    `<p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>`,
    `<p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>`,
  ];

  if (data.formType === "contato") {
    details.push(
      `<p><strong>Assunto:</strong> ${escapeHtml(contactSubjectLabels[data.subject])}</p>`
    );
  }

  if (data.formType === "trabalhe-comigo") {
    if (data.company) {
      details.push(
        `<p><strong>Empresa:</strong> ${escapeHtml(data.company)}</p>`
      );
    }
    details.push(
      `<p><strong>Tipo de parceria:</strong> ${escapeHtml(partnershipTypeLabels[data.type])}</p>`
    );
  }

  details.push(
    `<p><strong>Mensagem:</strong></p>`,
    `<p>${escapeHtml(data.message).replace(/\n/g, "<br />")}</p>`
  );

  return `
    <h2>Nova mensagem — ${escapeHtml(formTypeLabels[data.formType])}</h2>
    ${details.join("\n")}
  `.trim();
}

function buildConfirmationText(data: FormSubmission): string {
  return [
    `Olá ${data.name},`,
    "",
    `Recebemos sua mensagem enviada pelo formulário de ${formTypeLabels[data.formType]} do ${SITE_NAME}.`,
    "",
    "Responderei em até 5 dias úteis.",
    "",
    `Abraços,`,
    SITE_NAME,
  ].join("\n");
}

function buildConfirmationHtml(data: FormSubmission): string {
  return `
    <p>Olá ${escapeHtml(data.name)},</p>
    <p>
      Recebemos sua mensagem enviada pelo formulário de
      <strong>${escapeHtml(formTypeLabels[data.formType])}</strong> do ${escapeHtml(SITE_NAME)}.
    </p>
    <p>Responderei em até 5 dias úteis.</p>
    <p>Abraços,<br />${escapeHtml(SITE_NAME)}</p>
  `.trim();
}

function buildInternalSubject(data: FormSubmission): string {
  const label = formTypeLabels[data.formType];

  if (data.formType === "contato") {
    return `[${label}] ${contactSubjectLabels[data.subject]} — ${data.name}`;
  }

  if (data.formType === "trabalhe-comigo") {
    return `[${label}] ${partnershipTypeLabels[data.type]} — ${data.name}`;
  }

  return `[${label}] — ${data.name}`;
}

async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendFormEmails(data: FormSubmission) {
  const { CONTACT_EMAIL } = getServerEnv();

  await sendEmail({
    to: CONTACT_EMAIL,
    replyTo: data.email,
    subject: buildInternalSubject(data),
    html: buildInternalHtml(data),
    text: buildInternalDetails(data),
  });

  await sendEmail({
    to: data.email,
    subject: `Recebemos sua mensagem — ${SITE_NAME}`,
    html: buildConfirmationHtml(data),
    text: buildConfirmationText(data),
  });
}
