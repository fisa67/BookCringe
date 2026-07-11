"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { getOrCreateSettings, updateSettings } from "@/lib/services/settingsService";
import { settingsFormDataToInput, settingsFormSchema } from "@/lib/validations/settings";
import { formatValidationErrors } from "@/lib/validations/forms";
import { buildSettingsMetadata } from "@/lib/admin/settingsMetadata";

/**
 * Server Action do módulo Configurações — única porta de escrita usada pela
 * UI (`SettingsForm`). Toda a persistência passa por
 * `src/lib/services/settingsService.ts`; nenhum componente acessa o
 * Supabase diretamente. `clubService` é usado apenas para leitura (popular
 * os seletores de ano/mês ativo), nunca para escrita — a escrita do ano/mês
 * ativo do clube fica só em `settings.metadata` (ver limitação no
 * relatório: não é sincronizada com o `is_active` do módulo Clube).
 */

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const parsed = settingsFormSchema.safeParse(settingsFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const current = await getOrCreateSettings();

  if (!current) {
    redirect(
      `/admin/settings?error=${encodeURIComponent("Não foi possível carregar as configurações atuais.")}`
    );
  }

  const {
    description,
    linkedin_url,
    personal_site_url,
    hero_title,
    hero_subtitle,
    active_bookclub_year_id,
    active_bookclub_month_id,
    ...columns
  } = parsed.data;

  const metadata = buildSettingsMetadata(current.metadata, {
    description,
    linkedin_url,
    personal_site_url,
    hero_title,
    hero_subtitle,
    active_bookclub_year_id,
    active_bookclub_month_id,
  });

  const updated = await updateSettings({ id: current.id, ...columns, metadata });

  if (!updated) {
    redirect(
      `/admin/settings?error=${encodeURIComponent("Não foi possível salvar as configurações. Tente novamente.")}`
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  redirect("/admin/settings?success=1");
}
