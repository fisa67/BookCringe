import type { Metadata } from "next";
import { ImportCenter } from "@/components/admin/intelligence/ImportCenter";

export const metadata: Metadata = {
  title: "Importações — Intelligence — Admin BookCringe",
};

const IMPORTERS = [
  {
    name: "YouTube",
    description: "Detecção e Detection Preview do YouTube Studio já disponíveis. Persistência chega na próxima sprint.",
    icon: "play",
    status: "preview",
  },
  {
    name: "Instagram",
    description: "Importação futura de posts, reels, alcance e engajamento.",
    icon: "camera",
    status: "planned",
  },
  {
    name: "TikTok",
    description: "Importação futura de vídeos curtos, visualizações e interações.",
    icon: "music",
    status: "planned",
  },
  {
    name: "Meta Ads",
    description: "Importação futura de campanhas, custos e resultados pagos.",
    icon: "target",
    status: "planned",
  },
  {
    name: "Google Analytics",
    description: "Importação futura de tráfego, páginas e comportamento do site.",
    icon: "chart",
    status: "planned",
  },
  {
    name: "Manual",
    description: "Entrada futura para bases editoriais e arquivos avulsos.",
    icon: "file",
    status: "planned",
  },
] as const;

function ImporterIcon({ icon }: { icon: (typeof IMPORTERS)[number]["icon"] }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "play":
      return (
        <svg {...commonProps}>
          <path d="M6 4.5v15l13-7.5-13-7.5Z" />
        </svg>
      );
    case "camera":
      return (
        <svg {...commonProps}>
          <rect width="18" height="18" x="3" y="3" rx="5" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "music":
      return (
        <svg {...commonProps}>
          <path d="M9 18V5l10-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      );
    case "target":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case "chart":
      return (
        <svg {...commonProps}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 4-4 3 3 5-7" />
        </svg>
      );
    case "file":
      return (
        <svg {...commonProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );
  }
}

export default function IntelligenceImportsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Importações</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Importações</h2>
        <p className="mt-4 max-w-2xl text-slate-300">
          Centralize aqui os dados vindos das plataformas do BookCringe para preparar futuras análises,
          relatórios e automações editoriais.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Import Center</h3>
            <p className="mt-1 text-sm text-slate-400">
              Fluxo completo de importação — seleção, Detection Preview e Validação — para
              arquivos do YouTube Studio.
            </p>
          </div>
          <span className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300">
            Import Center: YouTube
          </span>
        </div>

        <ImportCenter />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Importadores disponíveis</h3>
          <p className="mt-1 text-sm text-slate-400">
            Conectores planejados para as próximas fases do Intelligence.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {IMPORTERS.map((importer) => (
            <article
              key={importer.name}
              className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300">
                  <ImporterIcon icon={importer.icon} />
                </div>
                {importer.status === "preview" ? (
                  <span className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Preview disponível
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-900/60 bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-300">
                    Em desenvolvimento
                  </span>
                )}
              </div>
              <h4 className="mt-4 text-lg font-semibold text-white">{importer.name}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{importer.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Histórico de importações</h3>
          <p className="mt-1 text-sm text-slate-400">
            As importações realizadas aparecerão aqui quando a funcionalidade for implementada.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800">
          <table className="min-w-[760px] w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Plataforma</th>
                <th className="px-5 py-4 font-medium">Arquivo</th>
                <th className="px-5 py-4 font-medium">Data</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Registros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60 text-slate-300">
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 3v18h18" />
                        <path d="M7 14h3" />
                        <path d="M12 10h3" />
                        <path d="M17 6h3" />
                      </svg>
                    </div>
                    <p className="mt-4 font-semibold text-white">Nenhuma importação registrada</p>
                    <p className="mt-2 text-sm text-slate-400">
                      O histórico será preenchido quando os importadores estiverem ativos.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
