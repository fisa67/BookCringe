interface IntelligencePlaceholderProps {
  eyebrow: string;
  title: string;
}

export function IntelligencePlaceholder({ eyebrow, title }: IntelligencePlaceholderProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-4 max-w-2xl text-slate-300">
        Estrutura inicial do módulo. Funcionalidades serão adicionadas em uma próxima etapa.
      </p>
    </section>
  );
}
