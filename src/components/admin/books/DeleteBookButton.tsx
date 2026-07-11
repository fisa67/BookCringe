"use client";

interface DeleteBookButtonProps {
  action: (formData: FormData) => void | Promise<void>;
  bookTitle: string;
}

/**
 * Único ponto de interatividade client-side do módulo Biblioteca: confirmação
 * nativa (`window.confirm`) antes de disparar a Server Action de exclusão.
 * Sem essa confirmação, um clique acidental excluiria o livro imediatamente.
 */
export function DeleteBookButton({ action, bookTitle }: DeleteBookButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Excluir "${bookTitle}"? Esta ação não pode ser desfeita.`
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-700 hover:bg-red-950/70 hover:text-red-200"
      >
        Excluir
      </button>
    </form>
  );
}
