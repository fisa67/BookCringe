import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Config do Vitest. Padrão continua "node" (a maioria dos testes é lógica
 * pura/serviços, sem DOM/React) — testes que precisam de um hook React
 * (`.test.tsx`) optam individualmente por `jsdom` via o pragma
 * `// @vitest-environment jsdom` no topo do arquivo, sem afetar os demais.
 * Alias `@/*` espelha o `tsconfig.json` para os testes poderem importar como
 * o app de verdade.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
