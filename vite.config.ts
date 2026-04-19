import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { defineConfig } from "vite";
import { setGlobalBindings } from "./app/environment.server";

export default defineConfig({
  plugins: [
    cloudflareDevProxy({
      getLoadContext({ context }) {
        setGlobalBindings(context.cloudflare.env as Record<string, unknown>);

        return {
          waitUntil(promise) {
            return context.cloudflare.ctx.waitUntil(promise);
          },
        };
      },
    }),
    mdx(),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    optimizeDeps: {
      include: [
        "@apihero/fetch",
        "@heroicons/react/outline",
        "react-dropzone",
      ],
    },
  },
});
