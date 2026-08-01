"use client";

import { useCallback, useRef, useState } from "react";
import { importYouTubeDatasetAction, previewYouTubeImportAction } from "@/app/admin/intelligence/importacoes/actions";
import {
  EMPTY_IMPORT_SESSION,
  summarizeImportPreview,
  validateImportPreview,
  type ImportSession,
} from "@/lib/intelligence/session";

/**
 * A etapa "Validação" ainda é simulada: hoje é só um cálculo local
 * instantâneo em cima do resultado da Detection Preview, sem nenhuma
 * chamada real. Esse atraso existe só para a etapa ser percebida como uma
 * etapa própria no Import Center, em vez de aparecer/desaparecer no mesmo
 * instante da preview.
 */
const SIMULATED_VALIDATION_DELAY_MS = 500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orquestra a Import Session no cliente: liga a seleção de arquivo à
 * Detection Preview já existente (`previewYouTubeImportAction`, inalterada
 * desde a Sprint 2) e, a partir do resultado, calcula a Validação. O
 * arquivo original fica guardado em `fileRef` — não no estado da sessão —
 * porque `confirmImport` precisa reenviá-lo para gerar os
 * `NormalizedImportRecord[]` de novo (a Detection Preview só guarda o
 * resumo, não os registros completos).
 */
export function useImportSession() {
  const [session, setSession] = useState<ImportSession>(EMPTY_IMPORT_SESSION);
  const tokenRef = useRef(0);
  const fileRef = useRef<File | null>(null);

  const selectFile = useCallback((file: File) => {
    const token = (tokenRef.current += 1);
    fileRef.current = file;

    setSession({
      ...EMPTY_IMPORT_SESSION,
      stage: "detecting",
      file: { name: file.name, size: file.size },
    });

    void (async () => {
      const formData = new FormData();
      formData.set("file", file);

      try {
        const preview = await previewYouTubeImportAction(formData);
        if (tokenRef.current !== token) return; // uma seleção mais recente já substituiu esta

        setSession((current) => ({
          ...current,
          stage: "validating",
          preview,
          summary: summarizeImportPreview(preview),
        }));

        await wait(SIMULATED_VALIDATION_DELAY_MS);
        if (tokenRef.current !== token) return;

        const validation = validateImportPreview(preview);
        setSession((current) => ({
          ...current,
          stage: validation.isValid ? "ready" : "blocked",
          validation,
        }));
      } catch {
        if (tokenRef.current !== token) return;
        setSession((current) => ({
          ...current,
          stage: "error",
          errorMessage: "Não foi possível processar o arquivo. Verifique se é um CSV válido e tente novamente.",
        }));
      }
    })();
  }, []);

  /** Confirma a importação — só tem efeito quando a sessão está em `ready` e o arquivo original ainda está disponível. */
  const confirmImport = useCallback(() => {
    const token = tokenRef.current;
    const file = fileRef.current;
    if (!file) return;

    let shouldImport = false;
    setSession((current) => {
      if (current.stage !== "ready") return current;
      shouldImport = true;
      return { ...current, stage: "importing" };
    });
    if (!shouldImport) return;

    void (async () => {
      const formData = new FormData();
      formData.set("file", file);

      try {
        const receipt = await importYouTubeDatasetAction(formData);
        if (tokenRef.current !== token) return;

        if (receipt.status === "persisted" && receipt.acceptedRecords > 0) {
          setSession((current) => ({ ...current, stage: "imported", importResult: receipt }));
        } else {
          setSession((current) => ({
            ...current,
            stage: "import_error",
            importResult: receipt,
            errorMessage:
              receipt.issues[0]?.message ?? "Não foi possível salvar os dados importados. Tente novamente.",
          }));
        }
      } catch {
        if (tokenRef.current !== token) return;
        setSession((current) => ({
          ...current,
          stage: "import_error",
          errorMessage: "Não foi possível salvar os dados importados. Tente novamente.",
        }));
      }
    })();
  }, []);

  const reset = useCallback(() => {
    tokenRef.current += 1;
    fileRef.current = null;
    setSession(EMPTY_IMPORT_SESSION);
  }, []);

  return { session, selectFile, confirmImport, reset };
}
