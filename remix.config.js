/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildTarget: "cloudflare-workers",
  serverBuildPath: "build/index.js",
  devServerBroadcastDelay: 1000,
  ignoredRouteFiles: [".*"],
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_lazyRouteDiscovery: false,
    v3_singleFetch: false,
  },
};
