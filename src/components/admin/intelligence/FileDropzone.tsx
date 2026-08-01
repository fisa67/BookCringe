"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onSelectFile: (file: File) => void;
  disabled?: boolean;
  /** Quando presente, mostra uma barra compacta em vez da área grande de drag-and-drop. */
  selectedFileName?: string;
}

function UploadIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/**
 * Área de seleção de arquivo (drag-and-drop ou clique) — etapa 1 do Import
 * Center. Puramente apresentacional: quem decide o que fazer com o arquivo
 * é `useImportSession`, via `onSelectFile`.
 */
export function FileDropzone({ onSelectFile, disabled, selectedFileName }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) onSelectFile(file);
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,text/csv"
      className="hidden"
      onChange={(event) => handleFiles(event.target.files)}
    />
  );

  if (selectedFileName) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-4">
        <p className="text-sm text-slate-300">
          Arquivo selecionado: <span className="font-medium text-white">{selectedFileName}</span>
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Selecionar outro arquivo
        </button>
        {hiddenInput}
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center transition-colors",
        isDragging ? "border-emerald-500 bg-emerald-950/10" : "border-slate-700 bg-slate-950/80"
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300">
        <UploadIcon />
      </div>
      <p className="mt-5 text-lg font-semibold text-white">Arraste um CSV do YouTube Studio para esta área</p>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Instagram, TikTok, Meta Ads, Google Analytics e Manual chegam em sprints futuras — por
        enquanto, só arquivos do YouTube seguem até o fim do fluxo.
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="mt-6 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Selecionar arquivo
      </button>
      {hiddenInput}
    </div>
  );
}
