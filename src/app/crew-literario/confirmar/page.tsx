import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { confirmSubscriberByToken } from "@/lib/services/subscriberService";
import { sendWelcomeEmail, shouldSendWelcomeEmail } from "@/lib/services/welcomeEmailService";
import { getPublicRecommendationOfMonth } from "@/lib/adapters/recommendationsPublicAdapter";

export const metadata: Metadata = {
  title: "Confirmar inscrição — Crew Literário",
};

interface ConfirmarPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

/**
 * Rota de confirmação do double opt-in (Fase 3C) — recebe `?token=...`
 * (enviado por `confirmationEmailService`), valida via
 * `confirmSubscriberByToken` e, só na transição real pendente → confirmado
 * (`shouldSendWelcomeEmail`), dispara o e-mail de boas-vindas. Feita como
 * Server Component simples (sem API route dedicada): a validação é a
 * única coisa que a página faz antes de renderizar o resultado, e
 * `confirmSubscriberByToken`/`sendWelcomeEmail` já são seguros para chamar
 * direto de um componente de servidor.
 */
export default async function ConfirmarCrewLiterarioPage({ searchParams }: ConfirmarPageProps) {
  const { token: rawToken } = await searchParams;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";

  if (!token) {
    return <InvalidState />;
  }

  const result = await confirmSubscriberByToken(token);

  if (!result.ok) {
    return <InvalidState message={result.error} />;
  }

  // Nunca reenvia o welcome e-mail se o link já tiver sido usado antes
  // (idempotência) — `shouldSendWelcomeEmail` cobre isso via `alreadyConfirmed`.
  if (shouldSendWelcomeEmail(result)) {
    const welcomeResult = await sendWelcomeEmail(result.email);

    if (!welcomeResult.ok) {
      console.error(
        "[crew-literario/confirmar] falha ao enviar e-mail de boas-vindas",
        welcomeResult.error
      );
    }
  }

  const recommendationOfMonth = await getPublicRecommendationOfMonth().catch((err: unknown) => {
    console.error("[crew-literario/confirmar] getPublicRecommendationOfMonth error", err);
    return null;
  });

  return (
    <PageHero
      badge="🎉 E-mail confirmado"
      eyebrow="Crew Literário"
      title="📚 Bem-vindo ao Crew Literário!"
      subtitle="Seu e-mail foi confirmado com sucesso."
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/recomendacoes">
          <Button variant="primary" size="lg">
            Ver Curadoria
          </Button>
        </Link>
        {recommendationOfMonth ? (
          <Link href={`/livro/${recommendationOfMonth.slug}`}>
            <Button variant="outline" size="lg">
              Ver Recomendação do Mês
            </Button>
          </Link>
        ) : null}
      </div>
    </PageHero>
  );
}

/** Estado de erro (token ausente, inválido, já utilizado ou falha inesperada) — sempre com um caminho de volta para tentar de novo. */
function InvalidState({ message }: { message?: string } = {}) {
  return (
    <PageHero
      badge="⚠️ Link inválido"
      eyebrow="Crew Literário"
      title="Não foi possível confirmar seu e-mail"
      description={
        message ??
        "Este link de confirmação é inválido ou já foi utilizado. Se você já confirmou antes, pode ficar tranquilo(a) — está tudo certo."
      }
    >
      <Link href="/crew-literario">
        <Button variant="primary" size="lg">
          Voltar para o Crew Literário
        </Button>
      </Link>
    </PageHero>
  );
}
