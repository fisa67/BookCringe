"use client";

import { useState } from "react";
import { BookCover } from "@/components/book/BookCover";
import { isDisplayableCoverPath } from "@/lib/utils";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";

interface BookCoverFieldProps {
  title: string;
  defaultValue?: string;
}

/**
 * Campo de capa do formulário de livro — preview em tempo real (reaproveita
 * `BookCover`, já usado no site público) enquanto a URL/path é digitada.
 *
 * Estrutura preparada para upload via Supabase Storage (bucket `covers`,
 * já existe na migration): quando essa etapa for implementada, basta trocar
 * o `<input type="text">` por um input de arquivo + Server Action de upload
 * que grave `cover_path` — o restante do formulário (preview, nome do campo,
 * persistência via `bookService`) não muda.
 */
export function BookCoverField({ title, defaultValue }: BookCoverFieldProps) {
  const [coverPath, setCoverPath] = useState(defaultValue ?? "");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="w-28 shrink-0">
        <BookCover
          title={title || "Capa"}
          cover={isDisplayableCoverPath(coverPath) ? coverPath : undefined}
          width={112}
          height={160}
          className="aspect-[2/3]"
        />
      </div>

      <div className="flex-1 space-y-2">
        <label htmlFor="cover_path" className={adminLabelClass}>
          Capa (URL ou path)
        </label>
        <input
          id="cover_path"
          name="cover_path"
          type="text"
          value={coverPath}
          onChange={(event) => setCoverPath(event.target.value)}
          placeholder="https://... ou /books/covers/arquivo.jpg"
          maxLength={500}
          className={adminInputClass}
        />
        <p className="text-xs text-slate-500">
          Upload direto via Supabase Storage (bucket <code>covers</code>) fica para uma fase
          futura. Por enquanto, informe a URL ou o path da capa manualmente.
        </p>
      </div>
    </div>
  );
}
