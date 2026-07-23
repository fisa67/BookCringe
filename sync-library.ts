import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CsvBook = {
  book_title: string;
  amazon_url: string;
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const books: CsvBook[] = [];

  await new Promise<void>((resolve) => {
    fs.createReadStream(path.join(process.cwd(), "books.csv"))
      .pipe(csv())
      .on("data", (row) => books.push(row))
      .on("end", () => resolve());
  });

  console.log(`Encontrados ${books.length} livros.`);

  let updated = 0;

  for (const book of books) {
    const coverPath = `/books/covers/${slugify(book.book_title)}.jpg`;

    const { data: existing } = await supabase
      .from("books")
      .select("id,title")
      .eq("title", book.book_title)
      .maybeSingle();

    if (!existing) {
      console.log(`⚠ Livro não encontrado: ${book.book_title}`);
      continue;
    }

    const { error } = await supabase
      .from("books")
      .update({
        amazon_url: book.amazon_url,
        cover_path: coverPath,
      })
      .eq("id", existing.id);

    if (error) {
      console.log(error.message);
      continue;
    }

    updated++;

    console.log(`✓ ${book.book_title}`);
  }

  console.log("");
  console.log(`Atualizados: ${updated}`);
}

main();