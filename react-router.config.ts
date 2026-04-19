import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  buildDirectory: "build",
  routeDiscovery: { mode: "initial" },
  serverBuildFile: "server/index.js",
  ssr: true,
} satisfies Config;
