import Image from "@tiptap/extension-image";
import { mergeAttributes, Node } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import type { NewsletterCtaAlign, NewsletterCtaVariant, NewsletterImageAlign, NewsletterImageSize } from "@/lib/newsletters/content";

export const NewsletterImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align") ?? "center",
        renderHTML: (attributes: { align?: NewsletterImageAlign }) => ({
          "data-align": attributes.align ?? "center",
        }),
      },
      size: {
        default: "full",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-size") ?? "full",
        renderHTML: (attributes: { size?: NewsletterImageSize }) => ({
          "data-size": attributes.size ?? "full",
        }),
      },
      href: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const parent = element.parentElement;
          return parent?.tagName === "A" ? parent.getAttribute("href") : null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { href, align, size, ...imageAttributes } = HTMLAttributes;
    const image = [
      "img",
      mergeAttributes(imageAttributes, {
        "data-newsletter-image": "true",
        "data-align": align ?? "center",
        "data-size": size ?? "full",
      }),
    ];

    return (href
      ? ["a", { href, target: "_blank", rel: "noopener noreferrer" }, image]
      : image) as DOMOutputSpec;
  },
});

export const NewsletterCta = Node.create({
  name: "newsletterCta",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      label: { default: "Leia mais" },
      href: { default: "" },
      variant: { default: "primary" },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-newsletter-cta="true"]',
        getAttrs: (element: HTMLElement) => ({
          label: element.textContent ?? "Leia mais",
          href: element.getAttribute("href") ?? "",
          variant: element.getAttribute("data-variant") ?? "primary",
          align: element.getAttribute("data-align") ?? "center",
        }),
      },
    ];
  },

  renderHTML({ node }) {
    const variant = (node.attrs.variant ?? "primary") as NewsletterCtaVariant;
    const align = (node.attrs.align ?? "center") as NewsletterCtaAlign;
    const colors =
      variant === "secondary"
        ? { background: "#f4f4f4", foreground: "#1a1a1a" }
        : { background: "#b42318", foreground: "#ffffff" };

    return [
      "a",
      mergeAttributes({
        href: node.attrs.href,
        "data-newsletter-cta": "true",
        "data-variant": variant,
        "data-align": align,
        target: "_blank",
        rel: "noopener noreferrer",
        style: `display:inline-block;background-color:${colors.background};color:${colors.foreground};padding:10px 16px;border-radius:4px;font-weight:700;text-decoration:none;`,
      }),
      node.attrs.label,
    ];
  },
});
