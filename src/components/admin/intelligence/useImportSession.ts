"use client";

import { useCallback, useRef, useState } from "react";
import { confirmImportAction, previewImportAction } from "@/app/admin/intelligence/importacoes/actions";
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
 * Detection Preview (`previewImportAction` — desde a Sprint 13 também
 * reconhece `.xlsx` de audiência do Instagram, além do `.csv` do YouTube) e,
 * a partir do resultado, calcula a Validação. O arquivo original fica
 * guardado em `fileRef` — não no estado da sessão — porque `confirmImport`
 * precisa reenviá-lo para gerar os `NormalizedImportRecord[]` de novo (a
 * Detection Preview só guarda o resumo, não os registros completos).
 *
 * `confirmImport` chama `confirmImportAction`, o dispatcher que decide (pela
 * extensão do arquivo) se grava no Dataset do YouTube ou no Dataset de
 * audiência do Instagram (`docs/intelligence/AUDIENCE_PERSISTENCE.md`,
 * Sprint 14) — o hook não precisa saber qual plataforma está em jogo. A
 * checagem "persistence" da Validação (`session/validation.ts`) continua
 * sendo o que impede a sessão de chegar em `ready` para qualquer plataforma
 * sem `persistence.ts` — hoje YouTube e Instagram.
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
        const preview = await previewImportAction(formData);
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
          errorMessage:
            "Não foi possível processar o arquivo. Verifique se é um CSV do YouTube/TikTok ou um XLSX de audiência do Instagram válido.",
        }));
      }
    })();
  }, []);

  /**
   * Confirma a importação — só tem efeito quando a sessão está em `ready` e
   * o arquivo original ainda está disponível.
   *
   * A decisão de importar é tomada de forma síncrona, lendo `session.stage`
   * diretamente (valor já committed do último render) — nunca a partir de
   * uma variável preenchida dentro do callback de `setSession`, já que esse
   * callback só é executado pelo React de forma assíncrona/diferida, depois
   * que o restante da função já terminou de rodar. Ler o resultado de dentro
   * do próprio callback (`shouldImport`) causava um `return` prematuro antes
   * de o callback ter chance de executar, travando a sessão em `importing`
   * para sempre sem nunca chamar a Server Action.
   */
  const confirmImport = useCallback(() => {
    const token = tokenRef.current;
    const file = fileRef.current;
    if (!file || session.stage !== "ready") return;

    setSession((current) => ({ ...current, stage: "importing" }));

    void (async () => {
      const formData = new FormData();
      formData.set("file", file);

      try {
        const receipt = await confirmImportAction(formData);
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
  }, [session.stage]);

  const reset = useCallback(() => {
    tokenRef.current += 1;
    fileRef.current = null;
    setSession(EMPTY_IMPORT_SESSION);
  }, []);

  return { session, selectFile, confirmImport, reset };
}
