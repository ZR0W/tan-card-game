import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@engine": path.resolve(__dirname, "src/engine"),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    globals: true,
    environment: "node",
    environmentMatchGlobs: [
      ["tests/ui/**", "jsdom"],
      ["tests/**", "node"],
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
