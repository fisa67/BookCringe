import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Config mínima do Vitest — só testes unitários de serviços isolados
 * (`src/lib/services/*`), sem DOM/React. Alias `@/*` espelha o
 * `tsconfig.json` para os testes poderem importar como o app de verdade.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
