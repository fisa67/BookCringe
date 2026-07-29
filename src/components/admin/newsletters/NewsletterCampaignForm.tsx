import Link from "next/link";
import type { CmsNewsletterCampaignRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import { NewsletterRichTextEditor } from "@/components/admin/newsletters/NewsletterRichTextEditor";

interface NewsletterCampaignFormProps {
  action: (formData: FormData) => void | Promise<void>;
  campaign?: CmsNewsletterCampaignRecord;
  cancelHref: string;
  submitLabel: string;
  errorMessage?: string;
}

/**
 * Formulário de newsletter (criar/editar) — título interno, assunto e
 * conteúdo Rich Text. Mesmo padrão de `ContentForm`: um único componente
 * para os dois modos, Server Action via `action`. O editor continua dentro
 * do formulário nativo; seu HTML fica em um input hidden chamado `content`,
 * preservando o contrato das Server Actions existentes.
 */
export function NewsletterCampaignForm({
  action,
  campaign,
  cancelHref,
  submitLabel,
  errorMessage,
}: NewsletterCampaignFormProps) {
  return (
    <form action={action} className="space-y-6">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="title" className={adminLabelClass}>
          Título interno *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={150}
          placeholder='Ex.: "Newsletter de agosto"'
          defaultValue={campaign?.title}
          className={adminInputClass}
        />
        <p className="text-xs text-slate-500">Só aparece aqui no admin — nunca é enviado no e-mail.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className={adminLabelClass}>
          Assunto do e-mail *
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          placeholder='Ex.: "As novidades do Crew Literário desta semana 📚"'
          defaultValue={campaign?.subject}
          className={adminInputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content-editor" className={adminLabelClass}>
          Conteúdo *
        </label>
        <NewsletterRichTextEditor initialContent={campaign?.content} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          {submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-slate-400 transition hover:text-slate-200">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
