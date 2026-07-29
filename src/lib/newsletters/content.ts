import sanitizeHtml, { type IOptions } from "sanitize-html";
import { escapeHtml } from "@/lib/email/resend";
import { isNewsletterRichText, plainTextToNewsletterHtml } from "@/lib/newsletters/legacyContent";
import { isSafeNewsletterLink, isSafeNewsletterMediaUrl } from "@/lib/newsletters/urls";

export type NewsletterImageAlign = "left" | "center" | "right";
export type NewsletterImageSize = "small" | "medium" | "full";
export type NewsletterCtaVariant = "primary" | "secondary";
export type NewsletterCtaAlign = "left" | "center" | "right";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "h2",
  "h3",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "img",
];

const ALLOWED_ATTRIBUTES: IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel", "data-newsletter-cta", "data-variant", "data-align"],
  img: ["src", "alt", "title", "data-align", "data-size"],
};

const BASE_SANITIZE_OPTIONS: IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
};

const EMAIL_ALLOWED_ATTRIBUTES: IOptions["allowedAttributes"] = {
  ...ALLOWED_ATTRIBUTES,
  p: ["style"],
  h2: ["style"],
  h3: ["style"],
  ul: ["style"],
  ol: ["style"],
  li: ["style"],
  blockquote: ["style"],
  a: ["href", "style", "data-newsletter-cta", "data-variant", "data-align"],
  img: ["src", "alt", "title", "width", "style"],
};

function normalizeAlign(value: string | undefined, fallback: NewsletterImageAlign): NewsletterImageAlign {
  return value === "left" || value === "right" || value === "center" ? value : fallback;
}

function normalizeImageSize(value: string | undefined): NewsletterImageSize {
  return value === "small" || value === "medium" || value === "full" ? value : "full";
}

function normalizeCtaVariant(value: string | undefined): NewsletterCtaVariant {
  return value === "secondary" ? "secondary" : "primary";
}

function normalizeCtaAlign(value: string | undefined): NewsletterCtaAlign {
  return value === "left" || value === "right" ? value : "center";
}

function normalizeStoredContent(value: string): string {
  const html = isNewsletterRichText(value) ? value : plainTextToNewsletterHtml(value);
  return sanitizeHtml(html, BASE_SANITIZE_OPTIONS).replace(/<img\b[^>]*>/gi, (tag) => {
    const source = tag.match(/\bsrc="([^"]*)"/i)?.[1] ?? "";
    return isSafeNewsletterMediaUrl(source) ? tag : "";
  });
}

/**
 * Sanitiza no servidor o HTML que veio do editor. Não permite style livre:
 * alinhamento, tamanho de imagem e aparência de CTA são representados por
 * data-attributes controlados pelo editor e convertidos em estilos inline
 * somente pelo renderer de e-mail.
 */
export function sanitizeNewsletterContent(value: string): string {
  return normalizeStoredContent(value);
}

function imageStyle(align: NewsletterImageAlign, size: NewsletterImageSize): string {
  const width = size === "small" ? "240px" : size === "medium" ? "400px" : "560px";
  const margin =
    align === "left" ? "0 auto 16px 0" : align === "right" ? "0 0 16px auto" : "0 auto 16px";

  return [
    "display:block",
    `width:${width}`,
    "max-width:100%",
    "height:auto",
    `margin:${margin}`,
    "border:0",
    "outline:none",
    "text-decoration:none",
  ].join(";");
}

function ctaColors(variant: NewsletterCtaVariant): { background: string; foreground: string } {
  return variant === "secondary"
    ? { background: "#f4f4f4", foreground: "#1a1a1a" }
    : { background: "#b42318", foreground: "#ffffff" };
}

function ctaStyle(variant: NewsletterCtaVariant): string {
  const colors = ctaColors(variant);
  return [
    `background-color:${colors.background}`,
    `color:${colors.foreground}`,
    "display:inline-block",
    "font-family:Arial,sans-serif",
    "font-size:14px",
    "font-weight:700",
    "line-height:1.2",
    "text-decoration:none",
    "padding:12px 20px",
    "border-radius:4px",
    "mso-padding-alt:0",
  ].join(";");
}

function ctaTableStyle(align: NewsletterCtaAlign): string {
  const margin = align === "left" ? "0 0 16px" : align === "right" ? "0 0 16px auto" : "0 auto 16px";
  return `margin:${margin};`;
}

function extractAttribute(attributes: string, name: string): string | undefined {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match?.[1];
}

/**
 * Converte o conteúdo sanitizado para HTML de e-mail: estilos inline,
 * imagens responsivas e CTA em tabela de apresentação para melhor suporte
 * em Outlook, Gmail e Apple Mail.
 */
export function renderNewsletterContentForEmail(value: string): string {
  const content = normalizeStoredContent(value);
  const rendered = sanitizeHtml(content, {
    ...BASE_SANITIZE_OPTIONS,
    allowedAttributes: EMAIL_ALLOWED_ATTRIBUTES,
    transformTags: {
      p: () => ({
        tagName: "p",
        attribs: { style: "margin:0 0 16px;" },
      }),
      h2: () => ({
        tagName: "h2",
        attribs: {
          style: "margin:24px 0 12px;font-family:Arial,sans-serif;font-size:24px;line-height:1.25;color:#1a1a1a;",
        },
      }),
      h3: () => ({
        tagName: "h3",
        attribs: {
          style: "margin:20px 0 10px;font-family:Arial,sans-serif;font-size:18px;line-height:1.35;color:#1a1a1a;",
        },
      }),
      ul: () => ({
        tagName: "ul",
        attribs: { style: "margin:0 0 16px;padding-left:24px;" },
      }),
      ol: () => ({
        tagName: "ol",
        attribs: { style: "margin:0 0 16px;padding-left:24px;" },
      }),
      li: () => ({
        tagName: "li",
        attribs: { style: "margin:0 0 8px;" },
      }),
      blockquote: () => ({
        tagName: "blockquote",
        attribs: {
          style:
            "margin:0 0 16px;padding:12px 16px;border-left:4px solid #b42318;background:#f8f8f8;color:#444;",
        },
      }),
      a: (_tagName, attributes) => {
        const href = attributes.href ?? "";
        const isCta = attributes["data-newsletter-cta"] === "true";

        if (isCta) {
          const ctaAttributes: Record<string, string> = {
            href: isSafeNewsletterLink(href) ? href : "#",
            "data-newsletter-cta": "true",
            "data-variant": normalizeCtaVariant(attributes["data-variant"]),
            "data-align": normalizeCtaAlign(attributes["data-align"]),
          };

          return {
            tagName: "a",
            attribs: ctaAttributes,
          };
        }

        const linkAttributes: Record<string, string> = {
          href: isSafeNewsletterLink(href) ? href : "#",
          style: "color:#b42318;text-decoration:underline;",
        };

        return {
          tagName: "a",
          attribs: linkAttributes,
        };
      },
      img: (_tagName, attributes) => {
        const src = attributes.src ?? "";
        const align = normalizeAlign(attributes["data-align"], "center");
        const size = normalizeImageSize(attributes["data-size"]);

        return {
          tagName: "img",
          attribs: {
            src: isSafeNewsletterMediaUrl(src) ? src : "",
            alt: attributes.alt ?? "",
            ...(attributes.title ? { title: attributes.title } : {}),
            width: size === "small" ? "240" : size === "medium" ? "400" : "560",
            style: imageStyle(align, size),
          },
        };
      },
    },
  }).replace(
    /<a\b([^>]*\bdata-newsletter-cta="true"[^>]*)>([\s\S]*?)<\/a>/gi,
    (_match, attributes: string, label: string) => {
      const href = extractAttribute(attributes, "href") ?? "#";
      const variant = normalizeCtaVariant(extractAttribute(attributes, "data-variant"));
      const align = normalizeCtaAlign(extractAttribute(attributes, "data-align"));
      const colors = ctaColors(variant);

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="${ctaTableStyle(align)}">
          <tr>
            <td align="${align}" bgcolor="${colors.background}" style="border-radius:4px;background-color:${colors.background};">
              <a href="${escapeHtml(href)}" style="${ctaStyle(variant)}">${label}</a>
            </td>
          </tr>
        </table>
      `.trim();
    }
  );

  return rendered;
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Gera a parte text/plain a partir do mesmo conteúdo usado no HTML. */
export function newsletterContentToPlainText(value: string): string {
  const content = normalizeStoredContent(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|h2|h3|li|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");

  return decodeBasicEntities(
    sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
