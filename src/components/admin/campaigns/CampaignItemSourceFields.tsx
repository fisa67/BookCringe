"use client";

import { useState } from "react";
import Link from "next/link";
import type { CmsBookRecord, CmsPromotionalCampaignItemRecord } from "@/lib/types/cms";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import {
  MANUAL_PROMOTIONAL_CAMPAIGN_ITEM_TYPES,
  PROMOTIONAL_CAMPAIGN_ITEM_SOURCES,
} from "@/lib/validations/promotionalCampaign";
import { PROMOTIONAL_ITEM_TYPE_LABELS } from "@/lib/admin/promotionalCampaignLabels";

type SourceType = (typeof PROMOTIONAL_CAMPAIGN_ITEM_SOURCES)[number];

interface CampaignItemSourceFieldsProps {
  books: CmsBookRecord[];
  item?: CmsPromotionalCampaignItemRecord;
  /** Pré-seleciona o livro ao abrir a partir de "Ações rápidas"/"Adicionar à campanha" da Biblioteca. */
  defaultBookId?: string;
}

/**
 * Ilha client do `PromotionalCampaignItemForm` — mesmo padrão de
 * `ContentAssociationFields`: alterna entre "Selecionar um livro da
 * Biblioteca" (exige `book_id`, `item_type` fixo em `"book"`, sem campos
 * manuais) e "Cadastrar um produto manualmente" (título/imagem/descrição/
 * link/tipo próprios, para produtos fora da Biblioteca) — ver
 * `promotionalCampaignItemFormSchema` para a validação correspondente.
 *
 * Sem livros cadastrados, força o fluxo manual — mesma lógica de
 * `ContentAssociationFields` quando `books` está vazio.
 */
export function CampaignItemSourceFields({ books, item, defaultBookId }: CampaignItemSourceFieldsProps) {
  const hasBooks = books.length > 0;
  const initialSource: SourceType = item ? (item.book_id ? "book" : "manual") : "book";
  const [sourceType, setSourceType] = useState<SourceType>(hasBooks ? initialSource : "manual");

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="space-y-2">
        <span className={adminLabelClass}>Como deseja cadastrar este item? *</span>
        <div className="flex flex-wrap gap-4">
          <label
            className={`flex items-center gap-2 text-sm ${hasBooks ? "text-slate-300" : "text-slate-600"}`}
          >
            <input
              type="radio"
              name="source_type"
              value="book"
              checked={sourceType === "book"}
              disabled={!hasBooks}
              onChange={() => setSourceType("book")}
              className="h-4 w-4 border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500 disabled:opacity-50"
            />
            Selecionar um livro da Biblioteca
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="radio"
              name="source_type"
              value="manual"
              checked={sourceType === "manual"}
              onChange={() => setSourceType("manual")}
              className="h-4 w-4 border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
            />
            Cadastrar um produto manualmente
          </label>
        </div>
        {!hasBooks ? (
          <p className="text-xs text-slate-500">
            Nenhum livro cadastrado ainda — você pode cadastrar manualmente, ou{" "}
            <Link href="/admin/books" className="underline hover:text-slate-300">
              cadastrar um livro
            </Link>{" "}
            para vinculá-lo depois.
          </p>
        ) : null}
      </div>

      {sourceType === "book" ? (
        <div className="space-y-2">
          <input type="hidden" name="item_type" value="book" />

          <label htmlFor="book_id" className={adminLabelClass}>
            Livro *
          </label>
          <select
            id="book_id"
            name="book_id"
            required
            defaultValue={item?.book_id ?? defaultBookId ?? ""}
            className={adminInputClass}
          >
            <option value="">Selecione um livro...</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — {book.author}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Capa, título, autor e link afiliado vêm automaticamente da Biblioteca.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className={adminLabelClass}>
              Título *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={item?.title ?? ""}
              placeholder="Kindle Paperwhite"
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image_url" className={adminLabelClass}>
              Imagem *
            </label>
            <input
              id="image_url"
              name="image_url"
              type="text"
              required
              maxLength={500}
              defaultValue={item?.image_url ?? ""}
              placeholder="https://... ou /images/produto.jpg"
              className={adminInputClass}
            />
            <p className="text-xs text-slate-500">Informe uma URL pública ou um path local de imagem.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className={adminLabelClass}>
              Descrição curta
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={item?.description ?? ""}
              placeholder="Leve, compacto e ideal para ler em qualquer lugar."
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="affiliate_url" className={adminLabelClass}>
              Link afiliado *
            </label>
            <input
              id="affiliate_url"
              name="affiliate_url"
              type="url"
              required
              defaultValue={item?.affiliate_url ?? ""}
              placeholder="https://www.amazon.com.br/..."
              className={adminInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="item_type" className={adminLabelClass}>
              Tipo *
            </label>
            <select
              id="item_type"
              name="item_type"
              required
              defaultValue={item?.item_type && item.item_type !== "book" ? item.item_type : "other"}
              className={adminInputClass}
            >
              {MANUAL_PROMOTIONAL_CAMPAIGN_ITEM_TYPES.map((value) => (
                <option key={value} value={value}>
                  {PROMOTIONAL_ITEM_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
