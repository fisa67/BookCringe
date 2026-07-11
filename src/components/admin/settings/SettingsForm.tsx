import type { CmsBookClubYearRecord, CmsSettingsRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import { getSettingsMetadataField } from "@/lib/admin/settingsMetadata";

interface MonthOption {
  id: string;
  label: string;
}

interface SettingsFormProps {
  action: (formData: FormData) => void | Promise<void>;
  settings: CmsSettingsRecord;
  years: CmsBookClubYearRecord[];
  monthOptions: MonthOption[];
  errorMessage?: string;
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}

/**
 * Formulário único de Configurações (sempre edição — `settings` é singleton
 * por convenção, ver `settingsService.getOrCreateSettings`). Campos sem
 * coluna própria (`description`, `linkedin_url`, `personal_site_url`,
 * `hero_title`, `hero_subtitle`, ano/mês ativo do clube) vêm de
 * `settings.metadata` — ver `src/lib/admin/settingsMetadata.ts`.
 */
export function SettingsForm({ action, settings, years, monthOptions, errorMessage }: SettingsFormProps) {
  const metadata = settings.metadata;

  return (
    <form action={action} className="space-y-10">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}

      <section className="space-y-4">
        <SectionTitle title="Informações institucionais" description="Nome, slogan e descrição do site." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="project_name" className={adminLabelClass}>
              Nome do site *
            </label>
            <input
              id="project_name"
              name="project_name"
              type="text"
              required
              maxLength={150}
              defaultValue={settings.project_name}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slogan" className={adminLabelClass}>
              Slogan
            </label>
            <input
              id="slogan"
              name="slogan"
              type="text"
              maxLength={200}
              defaultValue={settings.slogan}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="description" className={adminLabelClass}>
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={getSettingsMetadataField(metadata, "description")}
              className={adminInputClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Redes sociais" description="Links exibidos como fonte para o site público." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="instagram_url" className={adminLabelClass}>
              Instagram
            </label>
            <input
              id="instagram_url"
              name="instagram_url"
              type="url"
              placeholder="https://instagram.com/..."
              defaultValue={settings.instagram_url}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tiktok_url" className={adminLabelClass}>
              TikTok
            </label>
            <input
              id="tiktok_url"
              name="tiktok_url"
              type="url"
              placeholder="https://tiktok.com/@..."
              defaultValue={settings.tiktok_url}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="youtube_url" className={adminLabelClass}>
              YouTube
            </label>
            <input
              id="youtube_url"
              name="youtube_url"
              type="url"
              placeholder="https://youtube.com/@..."
              defaultValue={settings.youtube_url}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="goodreads_url" className={adminLabelClass}>
              Goodreads
            </label>
            <input
              id="goodreads_url"
              name="goodreads_url"
              type="url"
              placeholder="https://goodreads.com/..."
              defaultValue={settings.goodreads_url}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="linkedin_url" className={adminLabelClass}>
              LinkedIn
            </label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/..."
              defaultValue={getSettingsMetadataField(metadata, "linkedin_url")}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="personal_site_url" className={adminLabelClass}>
              Site pessoal
            </label>
            <input
              id="personal_site_url"
              name="personal_site_url"
              type="url"
              placeholder="https://..."
              defaultValue={getSettingsMetadataField(metadata, "personal_site_url")}
              className={adminInputClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Textos globais"
          description="Textos de apoio para o Hero da Home e conteúdo institucional geral."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="hero_title" className={adminLabelClass}>
              Título do Hero
            </label>
            <input
              id="hero_title"
              name="hero_title"
              type="text"
              maxLength={150}
              defaultValue={getSettingsMetadataField(metadata, "hero_title")}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="hero_subtitle" className={adminLabelClass}>
              Subtítulo do Hero
            </label>
            <input
              id="hero_subtitle"
              name="hero_subtitle"
              type="text"
              maxLength={250}
              defaultValue={getSettingsMetadataField(metadata, "hero_subtitle")}
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="home_text" className={adminLabelClass}>
              Textos institucionais
            </label>
            <textarea
              id="home_text"
              name="home_text"
              rows={5}
              maxLength={5000}
              defaultValue={settings.home_text}
              className={adminInputClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Configurações do Clube"
          description="Ano e mês marcados como ativos para referência administrativa. Ainda não conectado ao site público."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="active_bookclub_year_id" className={adminLabelClass}>
              Ano ativo
            </label>
            <select
              id="active_bookclub_year_id"
              name="active_bookclub_year_id"
              defaultValue={getSettingsMetadataField(metadata, "active_bookclub_year_id") ?? ""}
              className={adminInputClass}
            >
              <option value="">Nenhum</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="active_bookclub_month_id" className={adminLabelClass}>
              Mês ativo
            </label>
            <select
              id="active_bookclub_month_id"
              name="active_bookclub_month_id"
              defaultValue={getSettingsMetadataField(metadata, "active_bookclub_month_id") ?? ""}
              className={adminInputClass}
            >
              <option value="">Nenhum</option>
              {monthOptions.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Salvar configurações
        </button>
      </div>
    </form>
  );
}
