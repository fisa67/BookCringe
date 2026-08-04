"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { previewImportFile, type ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import { normalizeYouTubeStudioCsv } from "@/lib/intelligence/imports/platforms/youtube/parser";
import { youtubeStudioPersistence } from "@/lib/intelligence/imports/platforms/youtube/persistence";
import { normalizeInstagramAudienceRows } from "@/lib/intelligence/imports/platforms/instagram/audienceParser";
import { instagramAudiencePersistence } from "@/lib/intelligence/imports/platforms/instagram/persistence";
import { normalizeTikTokPromotionsCsv } from "@/lib/intelligence/imports/platforms/tiktok/promotionsParser";
import { tiktokPromotionsPersistence } from "@/lib/intelligence/imports/platforms/tiktok/persistence";
import { dispatchTikTokImport } from "@/lib/intelligence/imports/tiktokDispatch";
import type {
  ImportBatch,
  ImportFileDescriptor,
  ParserInput,
  PersistenceReceipt,
} from "@/lib/intelligence/imports/types";

function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx");
}

function getRequiredFile(formData: FormData): File {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Nenhum arquivo selecionado.");
  }
  return file;
}

/**
 * Executa a Detection Preview (detector genérico + adapter da plataforma —
 * hoje YouTube e Instagram/audiência) inteiramente em memória. Nenhum dado
 * é persistido aqui; ver `confirmImportAction` para a gravação real.
 *
 * Lê o arquivo como texto (`.csv`, usado pelo YouTube) ou como bytes
 * binários (`.xlsx`, usado pelo Instagram/audiência) de acordo com a
 * extensão — `previewImportFile` decide o resto a partir daí.
 *
 * Chamada diretamente pelo componente cliente (`useImportSession`), sem
 * `<form>`/redirect, pois o resultado é renderizado inline na própria página.
 */
export async function previewImportAction(formData: FormData): Promise<ImportPreviewResult> {
  const file = getRequiredFile(formData);

  const descriptor: ImportFileDescriptor = {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || undefined,
    extension: file.name.split(".").pop(),
    format: "unknown",
  };

  if (isXlsxFile(file)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return previewImportFile({ file: descriptor, buffer });
  }

  const content = await file.text();
  return previewImportFile({ file: descriptor, content });
}

/**
 * Confirma a importação do YouTube — refaz o parse + normalize do CSV
 * (determinístico e barato; a Detection Preview não guarda os
 * `NormalizedImportRecord[]`, só o resumo) e delega a gravação para
 * `youtubeStudioPersistence`: encontra/cria o Dataset do YouTube, cria o
 * Import e persiste Content/Metric para cada vídeo aceito.
 *
 * Chamada só internamente, pelo dispatcher `confirmImportAction` — a UI
 * (`useImportSession`) nunca importa esta função diretamente.
 */
export async function importYouTubeDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
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

/**
 * Confirma a importação da audiência do Instagram — mesma ideia de
 * `importYouTubeDatasetAction`, mas para `.xlsx`: extrai as linhas
 * (`parseXlsxToRows`), refaz o parse + normalize (`normalizeInstagramAudienceRows`)
 * e delega a gravação para `instagramAudiencePersistence`
 * (`docs/intelligence/AUDIENCE_PERSISTENCE.md`, Sprint 14) — que persiste
 * `Metric` sem `Content`, já que audiência não tem um item individual.
 *
 * Chamada só internamente, pelo dispatcher `confirmImportAction`.
 */
export async function importInstagramAudienceDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = await parseXlsxToRows(buffer);

  const descriptor: ImportFileDescriptor = {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || undefined,
    format: "excel",
  };

  const batch: ImportBatch = {
    id: randomUUID(),
    platform: "instagram",
    status: "detected",
    files: [descriptor],
    createdAt: new Date().toISOString(),
  };

  const parserInput: ParserInput = {
    batchId: batch.id,
    platform: "instagram",
    file: descriptor,
    payload: rows,
  };

  const { records, issues } = await normalizeInstagramAudienceRows({ batch, input: parserInput });

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

  const receipt = await instagramAudiencePersistence.persist(records, batch);
  revalidatePath("/admin/intelligence/importacoes");
  return receipt;
}

export async function importTikTokPromotionsDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
  const content = await file.text();
  const descriptor: ImportFileDescriptor = {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || undefined,
    extension: file.name.split(".").pop(),
    format: "csv",
  };
  const batch: ImportBatch = {
    id: randomUUID(),
    platform: "tiktok",
    status: "detected",
    files: [descriptor],
    createdAt: new Date().toISOString(),
  };
  const input: ParserInput = {
    batchId: batch.id,
    platform: "tiktok",
    file: descriptor,
    payload: content,
  };
  const { records, issues } = await normalizeTikTokPromotionsCsv({ batch, input });

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

  const receipt = await tiktokPromotionsPersistence.persist(records, batch);
  revalidatePath("/admin/intelligence/importacoes");
  return receipt;
}

/**
 * Ponto único que a UI chama para confirmar o "Importar" — despacha pela
 * extensão do arquivo, mesma decisão que `previewImportAction` já toma para
 * a Detection Preview. `useImportSession` chama só esta função; nunca as
 * duas de cima diretamente, para não precisar saber qual plataforma está em
 * jogo (o `session/validation.ts`, checagem "persistence", já garante que só
 * chegam aqui arquivos de plataformas com persistência implementada).
 */
export async function confirmImportAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);

  if (isXlsxFile(file)) {
    return importInstagramAudienceDatasetAction(formData);
  }

  const preview = await previewImportAction(formData);
  if (preview.status === "ready" && preview.platform === "youtube") {
    return importYouTubeDatasetAction(formData);
  }
  if (
    preview.status === "ready" &&
    dispatchTikTokImport(preview) === "tiktok_promotions"
  ) {
    return importTikTokPromotionsDatasetAction(formData);
  }

  return {
    batchId: randomUUID(),
    status: "failed",
    acceptedRecords: 0,
    rejectedRecords: 0,
    issues: [{
      stage: "persist",
      code: "unsupported-import-format",
      message: "O arquivo não corresponde a um formato com persistência disponível.",
    }],
  };
}
