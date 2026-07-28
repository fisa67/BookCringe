"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStatisticsByYear, createOrUpdateStatistics } from "@/lib/services/statsService";
import { statsFormDataToInput, statsFormSchema } from "@/lib/validations/stats";
import { formatValidationErrors } from "@/lib/validations/forms";

/**
 * Server Action do painel de meta anual (`/admin/stats`). Única escrita que
 * resta em `statistics` — `year`/`annual_goal`/`metadata` (ver
 * `CmsStatisticsRecord`). Faz upsert por `year` (índice único parcial, ver
 * `statsService.createOrUpdateStatistics`), preservando o `metadata`
 * existente da linha, e cria a linha do ano se ainda não existir.
 */
export async function updateAnnualGoalAction(formData: FormData): Promise<void> {
  const rawYear = formData.get("year");
  const parsed = statsFormSchema.safeParse(statsFormDataToInput(formData));

  if (!parsed.success) {
    const message = Object.values(formatValidationErrors(parsed.error))[0] ?? "Dados inválidos.";
    redirect(`/admin/stats?year=${rawYear}&error=${encodeURIComponent(message)}`);
  }

  const { year, annual_goal } = parsed.data;
  const current = await getStatisticsByYear(year);

  const updated = await createOrUpdateStatistics({
    year,
    annual_goal,
    metadata: current?.metadata ?? {},
  });

  if (!updated) {
    redirect(
      `/admin/stats?year=${year}&error=${encodeURIComponent("Não foi possível salvar a meta anual. Tente novamente.")}`
    );
  }

  revalidatePath("/admin/stats");
  revalidatePath("/estatisticas");
  redirect(`/admin/stats?year=${year}&success=1`);
}
