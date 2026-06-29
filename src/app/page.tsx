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
