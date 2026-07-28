import Link from "next/link";
import type { CmsNewsletterCampaignRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface NewsletterCampaignFormProps {
  action: (formData: FormData) => void | Promise<void>;
  campaign?: CmsNewsletterCampaignRecord;
  cancelHref: string;
  submitLabel: string;
  errorMessage?: string;
}

/**
 * Formulário de newsletter (criar/editar) — título interno, assunto e
 * conteúdo em texto simples. Mesmo padrão de `ContentForm`: um único
 * componente para os dois modos, Server Action via `action`. Sem editor
 * rico nem preview embutido nesta fase — o preview fica na página de
 * visualização (`/admin/newsletters/[id]`), depois de salvar.
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
        <label htmlFor="content" className={adminLabelClass}>
          Conteúdo *
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={16}
          maxLength={20000}
          placeholder="Escreva o conteúdo do e-mail em texto simples. Parágrafos separados por linha em branco viram parágrafos no e-mail."
          defaultValue={campaign?.content}
          className={adminInputClass}
        />
        <p className="text-xs text-slate-500">
          Texto simples por enquanto (sem editor rico) — depois de salvar, use &quot;Visualizar&quot; para conferir
          como o e-mail fica antes de enviar um teste.
        </p>
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
