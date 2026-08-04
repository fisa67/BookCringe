import type {
  ImportFileDescriptor,
  ImportFileFormat,
  ImportIssue,
  ImportPlatform,
  TikTokDatasetKind,
} from "@/lib/intelligence/imports/types";
import { intelligenceFileDetector } from "@/lib/intelligence/imports/detection";
import { dispatchTikTokImport } from "@/lib/intelligence/imports/tiktokDispatch";
import {
  buildYouTubeImportPreview,
  type YouTubeImportPreview,
} from "@/lib/intelligence/imports/platforms/youtube/preview";
import {
  buildInstagramAudiencePreview,
  type InstagramAudiencePreview,
} from "@/lib/intelligence/imports/platforms/instagram/audiencePreview";
import {
  buildTikTokPromotionsImportPreview,
  type TikTokPromotionsImportPreview,
} from "@/lib/intelligence/imports/platforms/tiktok/promotionsPreview";

/**
 * Ponto único que a UI de Importações chama para gerar a Detection Preview:
 * roda o detector (genérico, todas as plataformas) e, se houver um adapter
 * conectado para a plataforma detectada, delega o parse/normalize a ele.
 *
 * Não é um "parser genérico" — apenas despacha para o adapter da plataforma
 * certa, e para isso dois formatos de entrada convivem aqui:
 * - `content: string` — arquivos de texto (hoje só CSV, usado pelo YouTube),
 *   detectados a partir de uma amostra do próprio texto.
 * - `buffer: ArrayBuffer | Buffer` — arquivos binários (hoje só `.xlsx`,
 *   usado pelo Instagram/audiência); delega inteiramente a
 *   `buildInstagramAudiencePreview`, que já faz sua própria detecção a
 *   partir do cabeçalho extraído do xlsx (`imports/xlsx.ts`).
 *
 * Hoje YouTube (CSV) e Instagram/audiência (xlsx) têm adapter conectado; as
 * demais plataformas já detectadas (Instagram Reels, TikTok, Meta Ads)
 * retornam `unsupported` até que seus adapters sejam implementados em
 * sprints futuras. Quando uma próxima plataforma também precisar de
 * `buffer`, este dispatcher passa a decidir por `detection.platform` (como
 * já faz no caminho de `content`) em vez de assumir Instagram diretamente.
 */

export interface ImportPreviewUnsupported {
  status: "unsupported";
  platform: ImportPlatform;
  datasetKind?: TikTokDatasetKind;
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export interface ImportPreviewFailed {
  status: "failed";
  platform: ImportPlatform;
  datasetKind?: TikTokDatasetKind;
  format: ImportFileFormat;
  confidence: number;
  issues: ImportIssue[];
}

export interface ImportPreviewReadyYouTube {
  status: "ready";
  platform: "youtube";
  preview: YouTubeImportPreview;
}

export interface ImportPreviewReadyInstagram {
  status: "ready";
  platform: "instagram";
  preview: InstagramAudiencePreview;
}

export interface ImportPreviewReadyTikTok {
  status: "ready";
  platform: "tiktok";
  datasetKind: "tiktok_promotions";
  preview: TikTokPromotionsImportPreview;
}

export type ImportPreviewReady =
  | ImportPreviewReadyYouTube
  | ImportPreviewReadyInstagram
  | ImportPreviewReadyTikTok;

export type ImportPreviewResult = ImportPreviewReady | ImportPreviewUnsupported | ImportPreviewFailed;

export async function previewImportFile(
  params: { file: ImportFileDescriptor } & ({ content: string } | { buffer: ArrayBuffer | Buffer })
): Promise<ImportPreviewResult> {
  if ("buffer" in params) {
    const result = await buildInstagramAudiencePreview({ file: params.file, buffer: params.buffer });

    if (result.status === "ready") {
      return { status: "ready", platform: "instagram", preview: result.preview };
    }

    return {
      status: result.status,
      platform: result.platform,
      format: result.format,
      confidence: result.confidence,
      issues: result.issues,
    };
  }

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

  const tiktokDispatch = dispatchTikTokImport(detection);
  if (tiktokDispatch === "tiktok_promotions") {
    const preview = await buildTikTokPromotionsImportPreview({
      file: params.file,
      content: params.content,
      detection,
    });

    if (preview.recordCount === 0) {
      return {
        status: "failed",
        platform: detection.platform,
        datasetKind: detection.datasetKind,
        format: detection.format,
        confidence: detection.confidence,
        issues: preview.issues.length
          ? preview.issues
          : [{
              stage: "parse",
              code: "tiktok-promotions-no-valid-rows",
              message: "Nenhuma promoção válida foi encontrada no arquivo.",
            }],
      };
    }

    return {
      status: "ready",
      platform: "tiktok",
      datasetKind: "tiktok_promotions",
      preview,
    };
  }

  if (tiktokDispatch === "unsupported") {
    return {
      status: "unsupported",
      platform: "tiktok",
      datasetKind: detection.datasetKind,
      format: detection.format,
      confidence: detection.confidence,
      issues: [
        {
          stage: "detect",
          code: "tiktok-creator-unsupported",
          message: "TikTok Creator Analytics foi reconhecido, mas ainda não possui adapter.",
        },
      ],
    };
  }

  return {
    status: "unsupported",
    platform: detection.platform,
    ...(detection.datasetKind ? { datasetKind: detection.datasetKind } : {}),
    format: detection.format,
    confidence: detection.confidence,
    issues: detection.issues,
  };
}
