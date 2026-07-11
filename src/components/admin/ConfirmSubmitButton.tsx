"use client";

interface ConfirmSubmitButtonProps {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  label: string;
  className?: string;
}

/**
 * Botão genérico de submit com confirmação nativa (`window.confirm`) antes de
 * disparar uma Server Action — usado por qualquer exclusão do admin (anos,
 * meses, livros do mês). Único Client Component necessário para esse padrão;
 * evita recriar a mesma lógica em cada módulo.
 */
export function ConfirmSubmitButton({
  action,
  confirmMessage,
  label,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={
          className ??
          "rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-700 hover:bg-red-950/70 hover:text-red-200"
        }
      >
        {label}
      </button>
    </form>
  );
}
