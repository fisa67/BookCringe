export default function AdminStatsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Estatísticas</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Relatórios de leitura</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Visualizar e ajustar metas de leitura, total de livros lidos e métricas associadas.
        </p>
      </div>
    </div>
  );
}
