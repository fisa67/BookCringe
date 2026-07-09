import type { Metadata } from "next";
import { bookclubCalendars } from "@/data/bookclub";
import { BookClubHero } from "@/components/bookclub/BookClubHero";
import { ReadingBanner } from "@/components/bookclub/ReadingBanner";
import { BookTimeline } from "@/components/bookclub/BookTimeline";
import { BookClubCTA } from "@/components/bookclub/BookClubCTA";
import { BookClubForm } from "@/components/bookclub/BookClubForm";
import { getCurrentReading } from "@/lib/bookclub";

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
  const currentReading = getCurrentReading(bookclubCalendars);
  const currentYear = new Date().getFullYear();

  return (
    <>
      {currentReading ? (
        <>
          {/* ── Hero: dark, with logo illustration and stats */}
          <BookClubHero books={currentReading.calendar.books} year={currentReading.calendar.year} />

          {/* ── Current book banner (auto from current month) */}
          <ReadingBanner currentReading={currentReading} />

          {/* ── Full-year timeline */}
          <BookTimeline books={currentReading.calendar.books} year={currentReading.calendar.year} />
        </>
      ) : (
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto rounded-3xl border border-[var(--bc-border)] bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-3">
              Clube de Leitura
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--bc-ink)] mb-4">
              O calendário de leitura de {currentYear} ainda não foi publicado.
            </h1>
            <p className="text-[var(--bc-muted)] text-base leading-relaxed">
              Em breve teremos novos livros e leituras mensais. Enquanto isso, você pode se inscrever no clube e acompanhar as novidades.
            </p>
          </div>
        </section>
      )}

      {/* ── CTA section that scrolls to form */}
      <BookClubCTA formId={FORM_ID} />

      {/* ── Native sign-up form */}
      <BookClubForm id={FORM_ID} />
    </>
  );
}
