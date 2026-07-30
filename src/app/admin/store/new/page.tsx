import type { Metadata } from "next";
import { StoreCollectionForm } from "@/components/admin/store/StoreCollectionForm";
import { createStoreCollectionAction } from "@/app/admin/store/actions";

export const metadata: Metadata = {
  title: "Nova coleção — BookCringe Store",
};

interface NewStoreCollectionPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewStoreCollectionPage({
  searchParams,
}: NewStoreCollectionPageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">BookCringe Store</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Nova coleção</h1>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <StoreCollectionForm
          action={createStoreCollectionAction}
          cancelHref="/admin/store"
          errorMessage={error}
        />
      </div>
    </div>
  );
}
