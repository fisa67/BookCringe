"use client";

import { useState } from "react";

interface DeleteSubscriberButtonProps {
  action: (formData: FormData) => void | Promise<void>;
}

/**
 * Exclusão de assinante em `/admin/subscribers` — modal próprio (em vez do
 * `window.confirm` usado por `ConfirmSubmitButton` no resto do admin)
 * porque o texto pedido exige dois botões nomeados ("Cancelar"/"Excluir"),
 * que o diálogo nativo do navegador não permite customizar. Único
 * componente do CMS com modal — para as demais exclusões, `ConfirmSubmitButton`
 * continua sendo o padrão.
 */
export function DeleteSubscriberButton({ action }: DeleteSubscriberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-700 hover:bg-red-950/70 hover:text-red-200"
      >
        🗑 Excluir
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-subscriber-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="delete-subscriber-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              Remover assinante
            </p>
            <p className="mt-3 text-base font-semibold text-white">
              Tem certeza que deseja remover este assinante?
            </p>
            <p className="mt-2 text-sm text-slate-400">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancelar
              </button>
              <form action={action}>
                <button
                  type="submit"
                  className="rounded-md border border-red-800 bg-red-900/60 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
                >
                  Excluir
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
