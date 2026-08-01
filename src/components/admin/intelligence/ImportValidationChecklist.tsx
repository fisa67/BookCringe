import type { ImportValidationResult } from "@/lib/intelligence/session";
import { cn } from "@/lib/utils";

/** Lista os 4 critérios de Validação com mensagens amigáveis por item. */
export function ImportValidationChecklist({ validation }: { validation: ImportValidationResult }) {
  return (
    <ul className="space-y-3">
      {validation.checks.map((check) => (
        <li key={check.key} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              check.passed ? "bg-emerald-950/60 text-emerald-400" : "bg-red-950/60 text-red-400"
            )}
          >
            {check.passed ? "✓" : "✕"}
          </span>
          <div>
            <p className={cn("text-sm font-medium", check.passed ? "text-slate-100" : "text-red-300")}>
              {check.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{check.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
