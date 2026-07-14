import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { StatsSection } from "@/components/home/StatsSection";
import { AboutSection } from "@/components/home/AboutSection";
import { RecentReads } from "@/components/home/RecentReads";
import { ClubCTA } from "@/components/home/ClubCTA";
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
      <ClubCTA />
    </>
  );
}
