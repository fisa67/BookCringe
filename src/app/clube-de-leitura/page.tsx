import type { Metadata } from "next";
import { bookclub2026 } from "@/data/bookclub2026";
import { BookClubHero } from "@/components/bookclub/BookClubHero";
import { ReadingBanner } from "@/components/bookclub/ReadingBanner";
import { BookTimeline } from "@/components/bookclub/BookTimeline";
import { BookClubCTA } from "@/components/bookclub/BookClubCTA";
import { BookClubForm } from "@/components/bookclub/BookClubForm";

export const metadata: Metadata = {
  title: "Clube de Leitura",
  description:
    "Leia junto com a gente. O Clube de Leitura BookCringe reúne leitores todo mês para discutir livros, trocar perspectivas e descobrir novos autores. Gratuito e online.",
  openGraph: {
    title: "Clube de Leitura — BookCringe",
    description:
      "Leia no seu ritmo. Converse. Descubra novos autores. Faça parte da comunidade.",
    images: [{ url: "/logo.png", width: 900, height: 900, alt: "BookCringe" }],
  },
};

const FORM_ID = "inscricao";

export default function ClubeDeLeituraPage() {
  return (
    <>
      {/* ── Hero: dark, with logo illustration and stats */}
      <BookClubHero books={bookclub2026} />

      {/* ── Current book banner (auto from status: "reading") */}
      <ReadingBanner books={bookclub2026} />

      {/* ── Full-year timeline */}
      <BookTimeline books={bookclub2026} year={2026} />

      {/* ── CTA section that scrolls to form */}
      <BookClubCTA formId={FORM_ID} />

      {/* ── Native sign-up form */}
      <BookClubForm id={FORM_ID} />
    </>
  );
}
