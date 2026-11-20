import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const alias = { "@": import.meta.dirname + "/src" };

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/tests/**", "src/**/*.d.ts"],
    },
  },
  resolve: { alias },
});
