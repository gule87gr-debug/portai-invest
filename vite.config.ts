import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mcpPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Never ship source maps to production — they expose original sources.
    sourcemap: false,
    target: "es2020",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("src/lib/stockDatabase")) return "stock-database";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "charts";
          if (id.includes("node_modules/react-markdown") || id.includes("node_modules/micromark") || id.includes("node_modules/mdast")) return "markdown";
          // NOTE: do not split React/react-router into their own chunk — it
          // creates a circular chunk initialization ("Cannot access 'S' before
          // initialization") that leaves the published site blank.
        },
      },
    },

  },
  esbuild: {
    // Strip debug logging from production builds; keep warnings/errors.
    pure: mode === "production" ? ["console.log", "console.debug"] : [],
  },
}));

