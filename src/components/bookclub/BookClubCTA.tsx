interface BookClubCTAProps {
  formId: string;
}

export function BookClubCTA({ formId }: BookClubCTAProps) {
  return (
    <section className="py-20 px-6 bg-[var(--bc-surface)]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)] mb-4">
          Participe
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--bc-ink)] tracking-tight mb-4">
          Quer fazer parte do clube?
        </h2>
        <p className="text-[var(--bc-muted)] text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          Preencha o formulário abaixo. É gratuito, sem compromisso e você
          escolhe como prefere acompanhar.
        </p>

        <a
          href={`#${formId}`}
          className="inline-flex items-center gap-2 h-12 px-7 rounded-lg bg-[var(--bc-red)] text-white text-base font-medium hover:bg-[var(--bc-red-dark)] active:scale-[0.98] transition-all duration-150"
        >
          Quero participar
        </a>

        <p className="mt-5 text-sm text-[var(--bc-muted)]">
          Sem spam. Sem taxas. Apenas livros.
        </p>
      </div>
    </section>
  );
}
