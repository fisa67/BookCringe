"use client";

import { FileDropzone } from "@/components/admin/intelligence/FileDropzone";
import { ImportStepper } from "@/components/admin/intelligence/ImportStepper";
import { ImportValidationChecklist } from "@/components/admin/intelligence/ImportValidationChecklist";
import { useImportSession } from "@/components/admin/intelligence/useImportSession";
import type { ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import type { YouTubeImportPreview } from "@/lib/intelligence/imports/platforms/youtube/preview";
import { PLATFORM_LABELS, type ImportSession, type ImportSessionStage } from "@/lib/intelligence/session";
import { cn, formatNumber } from "@/lib/utils";

const PERIOD_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

function formatPeriodDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : PERIOD_FORMATTER.format(parsed);
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

/**
 * Import Center — orquestra as 4 etapas visuais (Selecionar arquivo →
 * Detection Preview → Validação → Pronto para importar) em cima da Import
 * Session (`useImportSession`). O botão "Importar" só fica habilitado
 * quando a Validação passa; ao ser confirmado, grava de verdade no Dataset
 * do YouTube (`confirmImport` → `importYouTubeDatasetAction`).
 */
export function ImportCenter() {
  const { session, selectFile, confirmImport, reset } = useImportSession();

  const isBusy = session.stage === "detecting" || session.stage === "validating" || session.stage === "importing";

  return (
    <div className="space-y-6">
      <ImportStepper stage={session.stage} />

      <FileDropzone
        onSelectFile={selectFile}
        disabled={isBusy}
        selectedFileName={session.file?.name}
      />

      {(session.stage === "error" || session.stage === "import_error") && session.errorMessage ? (
        <p role="alert" className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {session.errorMessage}
        </p>
      ) : null}

      {session.preview ? (
        <DetectionPreviewPanel preview={session.preview} isValidating={session.stage === "validating"} />
      ) : null}

      {session.validation ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Validação</p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {session.validation.isValid ? "Tudo certo" : "Encontramos alguns problemas"}
          </h3>
          <div className="mt-5">
            <ImportValidationChecklist validation={session.validation} />
          </div>
        </section>
      ) : null}

      {session.stage === "imported" && session.importResult ? (
        <ImportResultPanel result={session.importResult} />
      ) : null}

      <ImportFooter session={session} onImport={confirmImport} onReset={reset} />
    </div>
  );
}

function ImportResultPanel({ result }: { result: NonNullable<ImportSession["importResult"]> }) {
  return (
    <section className="rounded-3xl border border-emerald-900/60 bg-emerald-950/10 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-emerald-400">Importação concluída</p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {formatNumber(result.acceptedRecords)} vídeo(s) salvos no Dataset do YouTube
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        O Dataset foi criado automaticamente (se ainda não existisse) e agora tem um novo Import registrado.
      </p>

      {result.rejectedRecords > 0 || result.issues.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-200">
          {result.rejectedRecords > 0 ? (
            <p className="font-medium">{result.rejectedRecords} registro(s) não puderam ser salvos:</p>
          ) : null}
          <ul className="mt-2 space-y-1">
            {result.issues.map((issue, index) => (
              <li key={index}>• {issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function DetectionPreviewPanel({ preview, isValidating }: { preview: ImportPreviewResult; isValidating: boolean }) {
  if (preview.status === "ready") {
    return <YouTubeReadyPreview preview={preview.preview} isValidating={isValidating} />;
  }

  const isUnsupported = preview.status === "unsupported";

  return (
    <section className="rounded-3xl border border-amber-900/60 bg-amber-950/10 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-amber-400">
        {isUnsupported ? "Plataforma ainda não conectada" : "Falha na detecção"}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-white">{platformLabel(preview.platform)}</h3>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <PreviewField label="Tipo do arquivo" value={preview.format.toUpperCase()} />
        <PreviewField label="Confiança da detecção" value={formatConfidence(preview.confidence)} />
      </dl>

      {preview.issues.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-amber-200">
          {preview.issues.map((issue, index) => (
            <li key={index}>• {issue.message}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-amber-200">
          {isUnsupported
            ? "O adapter dessa plataforma ainda não foi implementado — por enquanto, apenas arquivos do YouTube Studio seguem até o fim do fluxo."
            : "Não foi possível gerar uma preview a partir deste arquivo."}
        </p>
      )}
    </section>
  );
}

function YouTubeReadyPreview({ preview, isValidating }: { preview: YouTubeImportPreview; isValidating: boolean }) {
  return (
    <section className="rounded-3xl border border-emerald-900/60 bg-emerald-950/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-400">Detection Preview</p>
          <h3 className="mt-2 text-xl font-semibold text-white">YouTube Studio</h3>
        </div>
        <span className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300">
          {isValidating ? "Validando..." : "Preview pronta"}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PreviewField label="Plataforma" value="YouTube" />
        <PreviewField label="Tipo do arquivo" value={preview.format.toUpperCase()} />
        <PreviewField
          label="Período"
          value={
            preview.period
              ? `${formatPeriodDate(preview.period.start)} – ${formatPeriodDate(preview.period.end)}`
              : "—"
          }
        />
        <PreviewField label="Quantidade de vídeos" value={formatNumber(preview.videoCount)} />
        <PreviewField label="Confiança da detecção" value={formatConfidence(preview.confidence)} />
      </dl>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-300">Métricas encontradas</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {preview.metrics.map((metric) => (
            <div key={metric.key} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatNumber(metric.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {preview.issues.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-200">
          <p className="font-medium">Linhas ignoradas durante o processamento:</p>
          <ul className="mt-2 space-y-1">
            {preview.issues.map((issue, index) => (
              <li key={index}>
                • {issue.message}
                {issue.row ? ` (linha ${issue.row})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-100">{value}</dd>
    </div>
  );
}

const FOOTER_MESSAGE_STYLES: Record<ImportSessionStage, string> = {
  idle: "text-slate-400",
  detecting: "text-slate-400",
  validating: "text-slate-400",
  ready: "text-emerald-300",
  blocked: "text-red-300",
  error: "text-red-300",
  importing: "text-slate-400",
  imported: "text-emerald-300",
  import_error: "text-red-300",
};

function footerMessage(session: ImportSession): string {
  switch (session.stage) {
    case "idle":
      return "Selecione um arquivo do YouTube Studio para começar.";
    case "detecting":
      return "Rodando a Detection Preview...";
    case "validating":
      return "Executando a validação...";
    case "ready":
      return "Pronto para importar.";
    case "blocked":
      return "Corrija os problemas antes de continuar.";
    case "error":
      return session.errorMessage ?? "Não foi possível processar o arquivo.";
    case "importing":
      return "Salvando os dados no Dataset do YouTube...";
    case "imported":
      return "Importação concluída.";
    case "import_error":
      return session.errorMessage ?? "Não foi possível salvar os dados importados.";
  }
}

function ImportFooter({
  session,
  onImport,
  onReset,
}: {
  session: ImportSession;
  onImport: () => void;
  onReset: () => void;
}) {
  const canImport = session.stage === "ready";
  const isImporting = session.stage === "importing";
  const isImported = session.stage === "imported";

  const buttonLabel = isImporting ? "Importando..." : isImported ? "Importado" : "Importar";

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <div>
        <p className={cn("text-sm font-medium", FOOTER_MESSAGE_STYLES[session.stage])}>{footerMessage(session)}</p>
      </div>

      <div className="flex items-center gap-3">
        {session.file ? (
          <button type="button" onClick={onReset} className="text-sm text-slate-400 transition hover:text-slate-200">
            {isImported ? "Nova importação" : "Recomeçar"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canImport}
          onClick={onImport}
          title={canImport ? undefined : "Corrija os problemas de validação antes de importar."}
          className={cn(
            "rounded-md border px-5 py-2.5 text-sm font-medium transition",
            canImport
              ? "border-emerald-700 bg-emerald-700/20 text-emerald-300 hover:bg-emerald-700/30"
              : "cursor-not-allowed border-slate-700 bg-slate-800/60 text-slate-500"
          )}
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}
