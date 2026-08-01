import { getImportStepStatus, IMPORT_STEPS, type ImportSessionStage, type ImportStepStatus } from "@/lib/intelligence/session";
import { cn } from "@/lib/utils";

const CIRCLE_STYLES: Record<ImportStepStatus, string> = {
  done: "border-emerald-600 bg-emerald-600 text-white",
  current: "border-slate-300 bg-white text-slate-900",
  blocked: "border-red-600 bg-red-600 text-white",
  pending: "border-slate-700 bg-slate-900 text-slate-500",
};

const LABEL_STYLES: Record<ImportStepStatus, string> = {
  done: "text-slate-200",
  current: "text-white",
  blocked: "text-red-300",
  pending: "text-slate-500",
};

/** Indicador visual das 4 etapas do Import Center, derivado só do `stage` da sessão. */
export function ImportStepper({ stage }: { stage: ImportSessionStage }) {
  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      {IMPORT_STEPS.map((step, index) => {
        const status = getImportStepStatus(step.id, stage);
        const isLast = index === IMPORT_STEPS.length - 1;

        return (
          <li key={step.id} className="flex flex-1 items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
            <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  CIRCLE_STYLES[status]
                )}
              >
                {status === "done" ? "✓" : status === "blocked" ? "!" : index + 1}
              </span>
              <span className={cn("text-sm font-medium sm:text-center", LABEL_STYLES[status])}>{step.label}</span>
            </div>
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-px flex-1 sm:mt-4 sm:block",
                  status === "done" ? "bg-emerald-700" : "bg-slate-800"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
