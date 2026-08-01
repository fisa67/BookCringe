import type {
  ImportFileDescriptor,
  ImportFileFormat,
  ImportIssue,
  ImportPlatform,
} from "@/lib/intelligence/imports/types";
import { intelligenceFileDetector } from "@/lib/intelligence/imports/detection";
import {
  buildYouTubeImportPreview,
  type YouTubeImportPreview,
} from "@/lib/intelligence/imports/platforms/youtube/preview";

/**
 * Ponto único que a UI de Importações chama para gerar a Detection Preview:
 * roda o detector (genérico, todas as plataformas) e, se houver um adapter
 * conectado para a plataforma detectada, delega o parse/normalize a ele.
 *
 * Não é um "parser genérico" — apenas despacha para o adapter da plataforma
 * certa. Hoje só o YouTube tem adapter conectado; as demais plataformas já
 * detectadas (Instagram, TikTok, Meta Ads) retornam `unsupported` até que
 * seus adapters sejam implementados em sprints futuras.
 */

export interface ImportPreviewUnsupported {
  status: "unsupported";
  platform: ImportPlatform;
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export interface ImportPreviewFailed {
  status: "failed";
  platform: ImportPlatform;
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export interface ImportPreviewReady {
  status: "ready";
  platform: "youtube";
  preview: YouTubeImportPreview;
}

export type ImportPreviewResult = ImportPreviewReady | ImportPreviewUnsupported | ImportPreviewFailed;

export async function previewImportFile(params: {
  file: ImportFileDescriptor;
  content: string;
}): Promise<ImportPreviewResult> {
  const detection = await intelligenceFileDetector.detect({
    file: params.file,
    contentSample: params.content,
  });

  if (detection.platform === "youtube") {
    const preview = await buildYouTubeImportPreview({
      file: params.file,
      content: params.content,
      detection,
    });

    if (preview.videoCount === 0) {
      return {
        status: "failed",
        platform: detection.platform,
        format: detection.format,
        confidence: detection.confidence,
        issues: preview.issues.length
          ? preview.issues
          : [
              {
                stage: "parse",
                code: "youtube-no-valid-rows",
                message: "Nenhum vídeo válido foi encontrado no arquivo.",
              },
            ],
      };
    }

    return { status: "ready", platform: "youtube", preview };
  }

  return {
    status: "unsupported",
    platform: detection.platform,
    format: detection.format,
    confidence: detection.confidence,
    issues: detection.issues,
  };
}
