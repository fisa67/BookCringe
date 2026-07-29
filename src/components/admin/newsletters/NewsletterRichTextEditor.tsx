"use client";

import { useRef, useState, useTransition } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { NodeSelection } from "@tiptap/pm/state";
import { getNewsletterEditorContent } from "@/lib/newsletters/legacyContent";
import {
  isSafeNewsletterLink,
  isSafeNewsletterMediaUrl,
} from "@/lib/newsletters/urls";
import { uploadNewsletterImageAction } from "@/app/admin/newsletters/actions";
import { NewsletterCta, NewsletterImage } from "@/components/admin/newsletters/newsletterExtensions";
import type {
  NewsletterCtaAlign,
  NewsletterCtaVariant,
  NewsletterImageAlign,
  NewsletterImageSize,
} from "@/lib/newsletters/content";

interface NewsletterRichTextEditorProps {
  initialContent?: string;
}

type LinkDialogState = {
  kind: "link";
  from: number;
  to: number;
  href: string;
  error?: string;
};

type ImageDialogState = {
  kind: "image";
  position: number;
  src: string;
  alt: string;
  href: string;
  align: NewsletterImageAlign;
  size: NewsletterImageSize;
  error?: string;
};

type CtaDialogState = {
  kind: "cta";
  position?: number;
  label: string;
  href: string;
  variant: NewsletterCtaVariant;
  align: NewsletterCtaAlign;
  error?: string;
};

type DialogState = LinkDialogState | ImageDialogState | CtaDialogState | null;

const buttonClass =
  "rounded border border-slate-700 px-2 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

function ToolbarButton({
  label,
  title,
  onClick,
  disabled = false,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={buttonClass} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function DialogShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function NewsletterRichTextEditor({ initialContent }: NewsletterRichTextEditorProps) {
  const initialHtml = getNewsletterEditorContent(initialContent);
  const [content, setContent] = useState(initialHtml);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      NewsletterImage.configure({ allowBase64: false }),
      NewsletterCta,
    ],
    content: initialHtml,
    onCreate: ({ editor: createdEditor }) => setContent(createdEditor.getHTML()),
    onUpdate: ({ editor: updatedEditor }) => setContent(updatedEditor.getHTML()),
    onSelectionUpdate: ({ editor: updatedEditor }) => {
      const nodeSelection =
        updatedEditor.state.selection instanceof NodeSelection ? updatedEditor.state.selection.node : null;
      setSelectedNodeType(nodeSelection?.type.name ?? null);
    },
  });

  const selectedNode = editor && editor.state.selection instanceof NodeSelection ? editor.state.selection.node : null;

  const openLinkDialog = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    setDialog({
      kind: "link",
      from,
      to,
      href: editor.getAttributes("link").href ?? "",
    });
  };

  const applyLink = (state: LinkDialogState) => {
    if (!editor) return;
    const href = state.href.trim();

    if (href && !isSafeNewsletterLink(href)) {
      setDialog({ ...state, error: "Use uma URL http://, https:// ou mailto:." });
      return;
    }

    const chain = editor.chain().focus().setTextSelection({ from: state.from, to: state.to });
    if (href) {
      chain.setLink({ href }).run();
    } else {
      chain.unsetLink().run();
    }
    setDialog(null);
  };

  const openSelectedImageDialog = () => {
    if (!editor || selectedNodeType !== "image") return;
    const node = selectedNode;
    if (!node) return;
    const attributes = editor.getAttributes("image");

    setDialog({
      kind: "image",
      position: editor.state.selection.from,
      src: attributes.src ?? "",
      alt: attributes.alt ?? "",
      href: attributes.href ?? "",
      align: attributes.align ?? "center",
      size: attributes.size ?? "full",
    });
  };

  const applyImage = (state: ImageDialogState) => {
    if (!editor) return;
    const href = state.href.trim();

    if (href && !isSafeNewsletterLink(href)) {
      setDialog({ ...state, error: "Use uma URL http:// ou https:// para o link da imagem." });
      return;
    }

    if (!isSafeNewsletterMediaUrl(state.src)) {
      setDialog({ ...state, error: "A imagem precisa usar uma URL http:// ou https:// válida." });
      return;
    }

    editor
      .chain()
      .focus()
      .setNodeSelection(state.position)
      .updateAttributes("image", {
        src: state.src,
        alt: state.alt.trim(),
        href: href || null,
        align: state.align,
        size: state.size,
      })
      .run();
    setDialog(null);
  };

  const openCtaDialog = () => {
    if (!editor) return;
    const node = selectedNode;
    const isEditing = selectedNodeType === "newsletterCta" && node?.type.name === "newsletterCta";
    const attributes = isEditing ? editor.getAttributes("newsletterCta") : {};

    setDialog({
      kind: "cta",
      position: isEditing ? editor.state.selection.from : undefined,
      label: attributes.label ?? "Leia mais",
      href: attributes.href ?? "",
      variant: attributes.variant ?? "primary",
      align: attributes.align ?? "center",
    });
  };

  const applyCta = (state: CtaDialogState) => {
    if (!editor) return;
    const label = state.label.trim();
    const href = state.href.trim();

    if (!label) {
      setDialog({ ...state, error: "Informe o texto do botão." });
      return;
    }
    if (!href || !isSafeNewsletterLink(href)) {
      setDialog({ ...state, error: "Informe uma URL http:// ou https:// válida." });
      return;
    }

    const attributes = {
      label,
      href,
      variant: state.variant,
      align: state.align,
    };

    if (state.position !== undefined) {
      editor.chain().focus().setNodeSelection(state.position).updateAttributes("newsletterCta", attributes).run();
    } else {
      editor.chain().focus().insertContent({ type: "newsletterCta", attrs: attributes }).run();
    }
    setDialog(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    startUpload(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadNewsletterImageAction(formData);

      if (!result.ok) {
        setDialog({
          kind: "image",
          position: editor.state.selection.from,
          src: "",
          alt: "",
          href: "",
          align: "center",
          size: "full",
          error: result.error,
        });
        return;
      }

      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src: result.url, alt: "", align: "center", size: "full" },
        })
        .run();
      setDialog({
        kind: "image",
        position: editor.state.selection.from,
        src: result.url,
        alt: "",
        href: "",
        align: "center",
        size: "full",
      });
    });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-slate-700 bg-slate-950">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-700 bg-slate-900 p-2">
          <ToolbarButton label="H2" title="Título H2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolbarButton label="H3" title="Título H3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
          <ToolbarButton label="B" title="Negrito" onClick={() => editor?.chain().focus().toggleBold().run()} />
          <ToolbarButton label="I" title="Itálico" onClick={() => editor?.chain().focus().toggleItalic().run()} />
          <ToolbarButton label="• Lista" title="Lista com marcadores" onClick={() => editor?.chain().focus().toggleBulletList().run()} />
          <ToolbarButton label="1. Lista" title="Lista numerada" onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
          <ToolbarButton
            label="Link"
            title="Adicionar ou editar link"
            onClick={openLinkDialog}
            disabled={!editor || (editor.state.selection.empty && !editor.isActive("link"))}
          />
          <ToolbarButton label="Quote" title="Citação" onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
          <ToolbarButton
            label={selectedNodeType === "image" ? "Editar imagem" : "Imagem"}
            title={selectedNodeType === "image" ? "Editar imagem selecionada" : "Inserir imagem"}
            onClick={() => (selectedNodeType === "image" ? openSelectedImageDialog() : fileInputRef.current?.click())}
            disabled={isUploading}
          />
          <ToolbarButton
            label={selectedNodeType === "newsletterCta" ? "Editar CTA" : "CTA"}
            title={selectedNodeType === "newsletterCta" ? "Editar botão CTA selecionado" : "Inserir botão CTA"}
            onClick={openCtaDialog}
          />
          <ToolbarButton label="↶" title="Desfazer" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} />
          <ToolbarButton label="↷" title="Refazer" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} />
          <ToolbarButton
            label="Limpar"
            title="Remover formatação"
            onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          {isUploading ? <span className="px-2 text-xs text-slate-400">Enviando imagem…</span> : null}
        </div>

        <div className="[&_.ProseMirror]:min-h-80 [&_.ProseMirror]:p-4 [&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-7 [&_.ProseMirror]:text-slate-100 [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-red-700 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_img]:my-3 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:cursor-pointer [&_.ProseMirror_img.ProseMirror-selectednode]:ring-2 [&_.ProseMirror_img.ProseMirror-selectednode]:ring-red-500">
          <EditorContent editor={editor} id="content-editor" />
        </div>
      </div>
      <input type="hidden" name="content" value={content} readOnly />
      <p className="text-xs text-slate-500">
        Crie livremente com texto, imagens e botões CTA. O preview e o e-mail usam a mesma renderização
        compatível com clientes de e-mail.
      </p>

      {dialog?.kind === "link" ? (
        <DialogShell title="Adicionar link">
          <div className="mt-4 space-y-3">
            <input
              autoFocus
              type="text"
              value={dialog.href}
              onChange={(event) => setDialog({ ...dialog, href: event.target.value, error: undefined })}
              placeholder="https://exemplo.com"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            {dialog.error ? <p className="text-sm text-red-300">{dialog.error}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className={buttonClass} onClick={() => setDialog(null)}>
                Cancelar
              </button>
              <button type="button" className={buttonClass} onClick={() => applyLink(dialog)}>
                {dialog.href.trim() ? "Aplicar" : "Remover link"}
              </button>
            </div>
          </div>
        </DialogShell>
      ) : null}

      {dialog?.kind === "image" ? (
        <DialogShell title="Configurar imagem">
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-slate-300">
              Texto alternativo
              <input
                autoFocus
                type="text"
                value={dialog.alt}
                onChange={(event) => setDialog({ ...dialog, alt: event.target.value, error: undefined })}
                placeholder="Descreva a imagem"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Link opcional
              <input
                type="text"
                value={dialog.href}
                onChange={(event) => setDialog({ ...dialog, href: event.target.value, error: undefined })}
                placeholder="https://exemplo.com"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Alinhamento
                <select
                  value={dialog.align}
                  onChange={(event) =>
                    setDialog({ ...dialog, align: event.target.value as NewsletterImageAlign })
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Tamanho
                <select
                  value={dialog.size}
                  onChange={(event) =>
                    setDialog({ ...dialog, size: event.target.value as NewsletterImageSize })
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="full">Largura total</option>
                </select>
              </label>
            </div>
            {dialog.error ? <p className="text-sm text-red-300">{dialog.error}</p> : null}
            <div className="flex justify-between gap-2">
              <button
                type="button"
                className="rounded border border-red-900/70 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                onClick={() => {
                  editor?.chain().focus().setNodeSelection(dialog.position).deleteSelection().run();
                  setDialog(null);
                }}
              >
                Remover imagem
              </button>
              <div className="flex gap-2">
                <button type="button" className={buttonClass} onClick={() => setDialog(null)}>
                  Cancelar
                </button>
                <button type="button" className={buttonClass} onClick={() => applyImage(dialog)}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </DialogShell>
      ) : null}

      {dialog?.kind === "cta" ? (
        <DialogShell title={dialog.position === undefined ? "Inserir botão CTA" : "Editar botão CTA"}>
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-slate-300">
              Texto do botão
              <input
                autoFocus
                type="text"
                maxLength={80}
                value={dialog.label}
                onChange={(event) => setDialog({ ...dialog, label: event.target.value, error: undefined })}
                placeholder="Leia mais"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-sm text-slate-300">
              URL
              <input
                type="text"
                value={dialog.href}
                onChange={(event) => setDialog({ ...dialog, href: event.target.value, error: undefined })}
                placeholder="https://bookcringe.com.br"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Estilo
                <select
                  value={dialog.variant}
                  onChange={(event) =>
                    setDialog({ ...dialog, variant: event.target.value as NewsletterCtaVariant })
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="primary">Principal</option>
                  <option value="secondary">Secundário</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Alinhamento
                <select
                  value={dialog.align}
                  onChange={(event) =>
                    setDialog({ ...dialog, align: event.target.value as NewsletterCtaAlign })
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </label>
            </div>
            {dialog.error ? <p className="text-sm text-red-300">{dialog.error}</p> : null}
            <div className="flex justify-between gap-2">
              {dialog.position !== undefined ? (
                <button
                  type="button"
                  className="rounded border border-red-900/70 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                  onClick={() => {
                    editor?.chain().focus().setNodeSelection(dialog.position as number).deleteSelection().run();
                    setDialog(null);
                  }}
                >
                  Remover CTA
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" className={buttonClass} onClick={() => setDialog(null)}>
                  Cancelar
                </button>
                <button type="button" className={buttonClass} onClick={() => applyCta(dialog)}>
                  Salvar CTA
                </button>
              </div>
            </div>
          </div>
        </DialogShell>
      ) : null}
    </div>
  );
}
