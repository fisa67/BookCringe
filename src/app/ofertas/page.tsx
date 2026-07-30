import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { AffiliateDisclosure } from "@/components/book/AffiliateDisclosure";
import { PromotionalOfferCard } from "@/components/promotions/PromotionalOfferCard";
import { getPublicPromotionalCampaign } from "@/lib/adapters/promotionalCampaignPublicAdapter";

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Ofertas e produtos selecionados pelo BookCringe para quem gosta de ler.",
};

export const revalidate = 300;

export default async function OfertasPage() {
  const campaign = await getPublicPromotionalCampaign();

  if (!campaign) {
    return (
      <>
        <PageHero
          eyebrow="Ofertas"
          title="Ofertas para quem gosta de ler"
          description="Em breve, uma seleção de livros, Kindles e acessórios escolhidos pelo BookCringe."
        />
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-6xl rounded-xl border border-dashed border-[var(--bc-border)] p-8 text-sm text-[var(--bc-muted)]">
            Nenhuma campanha promocional ativa no momento.
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Ofertas"
        title={campaign.name}
        description={campaign.description ?? "Uma seleção especial de produtos para quem gosta de ler."}
      >
        {campaign.banner_url ? (
          <div className="overflow-hidden rounded-xl border border-[var(--bc-border)] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.banner_url}
              alt={`Banner de ${campaign.name}`}
              className="max-h-96 w-full object-cover"
            />
          </div>
        ) : null}
      </PageHero>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          {campaign.items.length === 0 ? (
            <p className="text-sm text-[var(--bc-muted)]">
              Esta campanha ainda não tem ofertas publicadas.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {campaign.items.map((item) => (
                  <PromotionalOfferCard key={item.id} item={item} />
                ))}
              </div>
              <AffiliateDisclosure className="mt-10" />
            </>
          )}
        </div>
      </section>
    </>
  );
}
