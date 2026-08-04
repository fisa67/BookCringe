import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

console.log({
  url: !!supabaseUrl,
  anon: !!supabaseAnonKey,
  service: !!supabaseServiceRoleKey,
  serviceLength: supabaseServiceRoleKey.length,
});

/**
 * Cria o client de forma preguiçosa (sob demanda) via Proxy.
 *
 * O @supabase/supabase-js valida a URL na construção e lança se ela estiver
 * vazia. Instanciar no topo do módulo quebraria o `next build` (as variáveis de
 * ambiente não existem em tempo de build). Com a criação preguiçosa, o client
 * só é construído no primeiro uso real — quando as variáveis já estão presentes.
 * O comportamento em runtime (com env configurada) é idêntico ao anterior.
 */
function createLazyClient(key: string): SupabaseClient<Database> {
  let instance: SupabaseClient<Database> | null = null;

  const getInstance = (): SupabaseClient<Database> => {
    instance ??= createClient<Database>(supabaseUrl, key, {
      auth: { persistSession: false },
    });
    return instance;
  };

  return new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop) {
      const client = getInstance();
      const value = Reflect.get(client, prop);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}
console.log("SUPABASE_URL:", !!supabaseUrl);
console.log("SUPABASE_ANON_KEY:", !!supabaseAnonKey);
console.log("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceRoleKey);
console.log("SERVICE_ROLE length:", supabaseServiceRoleKey?.length);


export const supabaseAdminClient: SupabaseClient<Database> = createLazyClient(supabaseServiceRoleKey);

export const supabasePublicClient: SupabaseClient<Database> = createLazyClient(supabaseAnonKey);
