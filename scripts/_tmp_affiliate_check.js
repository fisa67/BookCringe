const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author, amazon_url, cover_path")
    .ilike("title", "%meia-noite%");

  if (error) {
    console.error("error", error);
    process.exit(1);
  }

  console.log("Livros com 'meia-noite' no título:");
  console.log(books);

  if (books && books.length > 0) {
    const bookId = books[0].id;
    const { data: reading } = await supabase
      .from("book_readings")
      .select("*")
      .eq("book_id", bookId)
      .maybeSingle();
    console.log("\nLeitura associada:");
    console.log(reading);
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("id, amazon_associate_id, amazon_url")
    .limit(1)
    .maybeSingle();
  console.log("\nSettings atuais:");
  console.log(settings);
}

main();
