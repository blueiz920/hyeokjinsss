import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    coverage: {
      include: [
        "hooks/useScrollRuntime.tsx",
        "lib/animation/skillsBackground.ts",
        "lib/animation/scrollRuntime.ts",
      ],
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        branches: 85,
        functions: 100,
        lines: 100,
        statements: 95,
      },
    },
    environment: "jsdom",
    restoreMocks: true,
  },
});
