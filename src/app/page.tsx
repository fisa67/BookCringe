import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { StatsSection } from "@/components/home/StatsSection";
import { AboutSection } from "@/components/home/AboutSection";
import { RecentReads } from "@/components/home/RecentReads";
import { RecentContents } from "@/components/home/RecentContents";
import { LatestReflections } from "@/components/home/LatestReflections";
import { ClubCTA } from "@/components/home/ClubCTA";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { AffiliateDisclosure } from "@/components/book/AffiliateDisclosure";
import { SITE_NAME, SITE_SLOGAN, SITE_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_SLOGAN}`,
  description: SITE_DESCRIPTION,
};

// StatsSection, RecentReads (Estatísticas) e ClubCTA (Clube de Leitura)
// leem dados do Supabase — mesma estratégia de revalidate de
// src/app/clube-de-leitura/page.tsx.
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <StatsSection />
      <RecentReads />
      <RecentContents />
      <LatestReflections />
      <ClubCTA />
      <NewsletterSection />

      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <AffiliateDisclosure />
        </div>
      </div>
    </>
  );
}
