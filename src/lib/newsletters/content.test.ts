import { describe, expect, it } from "vitest";
import {
  newsletterContentToPlainText,
  renderNewsletterContentForEmail,
  sanitizeNewsletterContent,
} from "@/lib/newsletters/content";

describe("newsletter rich text content", () => {
  it("converte conteúdo legado preservando parágrafos, quebras e emojis", () => {
    const html = renderNewsletterContentForEmail("Olá 😊\n\nA próxima leitura está aqui.");

    expect(html).toContain("<p");
    expect(html).toContain("Olá 😊");
    expect(html).toContain("A próxima leitura está aqui.");
    expect(html).not.toContain("Olá 😊\\n");
  });

  it("remove scripts, eventos e protocolos inseguros", () => {
    const sanitized = sanitizeNewsletterContent(`
      <script>alert("x")</script>
      <p onclick="alert('x')">Texto <strong>seguro</strong></p>
      <a href="javascript:alert('x')">Link perigoso</a>
      <img src="javascript:alert('x')" onerror="alert('x')" alt="Imagem" />
    `);

    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).toContain("<strong>seguro</strong>");
  });

  it("renderiza imagem responsiva com alt e CTA em tabela de e-mail", () => {
    const html = renderNewsletterContentForEmail(`
      <h2>Recomendação do mês</h2>
      <img
        src="https://cdn.example.com/capa.webp"
        alt="Capa de A Odisseia"
        data-align="center"
        data-size="medium"
      />
      <a
        href="https://bookcringe.com.br/recomendacoes"
        data-newsletter-cta="true"
        data-variant="primary"
        data-align="center"
      >Conheça a Curadoria</a>
    `);

    expect(html).toContain('src="https://cdn.example.com/capa.webp"');
    expect(html).toContain('alt="Capa de A Odisseia"');
    expect(html).toContain("max-width:100%");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("Conheça a Curadoria");
    expect(html).not.toContain('data-newsletter-cta="true"');
  });

  it("gera texto alternativo a partir do mesmo conteúdo do e-mail", () => {
    const text = newsletterContentToPlainText(`
      <h2>Leia mais</h2>
      <p>Um texto <strong>importante</strong>.</p>
      <ul><li>Primeiro item</li><li>Segundo item</li></ul>
    `);

    expect(text).toContain("Leia mais");
    expect(text).toContain("Um texto importante.");
    expect(text).toContain("• Primeiro item");
    expect(text).toContain("• Segundo item");
  });
});
