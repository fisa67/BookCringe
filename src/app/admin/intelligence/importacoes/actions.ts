"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { previewImportFile, type ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import { normalizeYouTubeStudioCsv } from "@/lib/intelligence/imports/platforms/youtube/parser";
import { youtubeStudioPersistence } from "@/lib/intelligence/imports/platforms/youtube/persistence";
import type {
  ImportBatch,
  ImportFileDescriptor,
  ParserInput,
  PersistenceReceipt,
} from "@/lib/intelligence/imports/types";

/**
 * Executa a Detection Preview (detector genérico + adapter da plataforma —
 * hoje só o YouTube) inteiramente em memória. Nenhum dado é persistido
 * aqui; ver `importYouTubeDatasetAction` para a gravação real.
 *
 * Chamada diretamente pelo componente cliente (`useImportSession`), sem
 * `<form>`/redirect, pois o resultado é renderizado inline na própria página.
 */
export async function previewYouTubeImportAction(formData: FormData): Promise<ImportPreviewResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Nenhum arquivo selecionado.");
  }

  const content = await file.text();

  const descriptor: ImportFileDescriptor = {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || undefined,
    format: "unknown",
  };

  return previewImportFile({ file: descriptor, content });
}

/**
 * Confirma a importação — chamada pelo botão "Importar" quando a sessão
 * chega em `ready`. A Detection Preview não guarda os
 * `NormalizedImportRecord[]` (só o resumo, em
 * `imports/platforms/youtube/preview.ts`), então refaz o parse + normalize
 * do mesmo arquivo — determinístico e barato — e delega a gravação para
 * `youtubeStudioPersistence`: encontra/cria o Dataset do YouTube, cria o
 * Import e persiste Content/Metric para cada vídeo aceito.
 *
 * É o único ponto do módulo Intelligence que, de fato, grava no Supabase.
 */
export async function importYouTubeDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Nenhum arquivo selecionado.");
  }

  const content = await file.text();

  const descriptor: ImportFileDescriptor = {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || undefined,
    format: "unknown",
  };

  const batch: ImportBatch = {
    id: randomUUID(),
    platform: "youtube",
    status: "detected",
    files: [descriptor],
    createdAt: new Date().toISOString(),
  };

  const parserInput: ParserInput = {
    batchId: batch.id,
    platform: "youtube",
    file: descriptor,
    payload: content,
  };

  const { records, issues } = await normalizeYouTubeStudioCsv({ batch, input: parserInput });

  if (records.length === 0) {
    return {
      batchId: batch.id,
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 0,
      issues: issues.length
        ? issues
        : [{ stage: "persist", message: "Nenhum registro válido para importar." }],
    };
  }

  const receipt = await youtubeStudioPersistence.persist(records, batch);
  revalidatePath("/admin/intelligence/importacoes");
  return receipt;
}
