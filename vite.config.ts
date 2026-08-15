// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { publicBackendConfig } from "./public-backend.config";

const backendUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? publicBackendConfig.url;
const backendPublishableKey =
  process.env["SUPABASE_PUBLISHABLE_KEY"] ??
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  process.env["VITE_SUPABASE_ANON_KEY"] ??
  publicBackendConfig.publishableKey;
const backendProjectId =
  process.env["SUPABASE_PROJECT_ID"] ??
  process.env["VITE_SUPABASE_PROJECT_ID"] ??
  publicBackendConfig.projectId;

export default defineConfig({
  plugins: [mcpPlugin()],
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(backendUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(backendPublishableKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(backendProjectId),
      "process.env.SUPABASE_URL": JSON.stringify(backendUrl),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(backendPublishableKey),
      "process.env.SUPABASE_PROJECT_ID": JSON.stringify(backendProjectId),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
