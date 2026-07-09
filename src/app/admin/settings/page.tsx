import { getOrCreateSettings } from "@/lib/services/settingsService";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const settings = await getOrCreateSettings();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Configurações</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Configurar o site</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Valores globais do site, incluindo o ID de associado Amazon que gera URLs de afiliado automaticamente.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8">
        <h2 className="text-xl font-semibold text-white">Configuração atual</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">Projeto</dt>
            <dd className="mt-1 text-sm text-slate-200">{settings?.project_name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">Meta anual</dt>
            <dd className="mt-1 text-sm text-slate-200">{settings?.annual_goal}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">Amazon Associate ID</dt>
            <dd className="mt-1 text-sm text-slate-200">{settings?.amazon_associate_id ?? "Não configurado"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">Amazon URL base</dt>
            <dd className="mt-1 text-sm text-slate-200">{settings?.amazon_url ?? "Não configurado"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
