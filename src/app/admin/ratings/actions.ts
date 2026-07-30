"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteBookRating } from "@/lib/services/bookRatingService";

export async function deleteBookRatingAction(id: string): Promise<void> {
  const deleted = await deleteBookRating(id);

  if (!deleted) {
    redirect(
      `/admin/ratings?error=${encodeURIComponent(
        "Não foi possível remover a avaliação. Tente novamente."
      )}`
    );
  }

  revalidatePath("/admin/ratings");
  revalidatePath("/livro/[slug]", "page");
  redirect("/admin/ratings");
}
