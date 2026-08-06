import type { Metadata } from "next";
import { getOrCreateSettings } from "@/lib/services/settingsService";
import { getBookClubMonths, getBookClubYears } from "@/lib/services/clubService";
import { getMonthLabel } from "@/lib/admin/bookclubLabels";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { updateSettingsAction } from "@/app/admin/settings/actions";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Configurações — Admin BookCringe",
};

interface AdminSettingsPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const { error, success } = await searchParams;
  const settings = await getOrCreateSettings();
  const years = (await getBookClubYears()) ?? [];

  const monthLists = await Promise.all(years.map((year) => getBookClubMonths(year.id)));
  const monthOptions = years.flatMap((year, index) =>
    (monthLists[index] ?? []).map((month) => ({
      id: month.id,
      label: `${year.year} — ${getMonthLabel(month.month)}`,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Configurações</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Central de configurações</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Informações institucionais, redes sociais, textos globais e configurações do Clube de Leitura.
        </p>
      </div>

      {success ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-4 text-sm text-emerald-300">
          Configurações salvas com sucesso.
        </p>
      ) : null}

      {settings === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar as configurações. Tente novamente em alguns instantes.
        </p>
      ) : (
        <>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <SettingsForm
              action={updateSettingsAction}
              settings={settings}
              years={years}
              monthOptions={monthOptions}
              errorMessage={error}
            />
          </div>
        </>
      )}
    </div>
  );
}
