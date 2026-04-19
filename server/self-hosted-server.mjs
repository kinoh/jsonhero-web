import { createRequestHandler } from "react-router";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable,
} from "@react-router/node";
import { createNodeDocumentsBinding } from "./documents-binding.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildDirectory = path.resolve(__dirname, "../build/client");
const publicDirectory = path.resolve(__dirname, "../public");
const port = Number(process.env.PORT ?? "3000");
const host = process.env.HOST ?? "0.0.0.0";

globalThis.DOCUMENTS = createNodeDocumentsBinding(
  process.env.JSONHERO_STORAGE_DIR ?? path.resolve(__dirname, "../data/documents")
);
globalThis.SESSION_SECRET = process.env.SESSION_SECRET;

if (process.env.GRAPH_JSON_COLLECTION) {
  globalThis.GRAPH_JSON_COLLECTION = process.env.GRAPH_JSON_COLLECTION;
}

if (process.env.GRAPH_JSON_API_KEY) {
  globalThis.GRAPH_JSON_API_KEY = process.env.GRAPH_JSON_API_KEY;
}

if (process.env.APIHERO_PROJECT_KEY) {
  globalThis.APIHERO_PROJECT_KEY = process.env.APIHERO_PROJECT_KEY;
}

const build = await import("../build/server/server/index.js");
const handleRequest = createRequestHandler(
  build,
  process.env.NODE_ENV ?? "production"
);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function getContentType(filePath) {
  return contentTypes.get(path.extname(filePath)) ?? "application/octet-stream";
}

function createFetchRequest(request, response) {
  const origin = `http://${request.headers.host ?? "localhost"}`;
  const url = new URL(request.url ?? "/", origin);
  const headers = new Headers();

  for (const [headerName, headerValue] of Object.entries(request.headers)) {
    if (Array.isArray(headerValue)) {
      for (const value of headerValue) {
        headers.append(headerName, value);
      }
    } else if (headerValue != null) {
      headers.set(headerName, headerValue);
    }
  }

  let controller = new AbortController();
  response.on("finish", () => {
    controller = null;
  });
  response.on("close", () => {
    controller?.abort();
  });

  const init = {
    headers,
    method: request.method,
    signal: controller.signal,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = createReadableStreamFromReadable(request);
    init.duplex = "half";
  }

  return new Request(url, init);
}

function getClientAddress(nodeRequest) {
  const forwardedFor = nodeRequest.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].split(",")[0].trim();
  }

  return nodeRequest.socket.remoteAddress ?? "-";
}

function attachAccessLog(nodeRequest, nodeResponse) {
  const startedAt = process.hrtime.bigint();
  let isLogged = false;

  const logRequest = (eventName) => {
    if (isLogged) {
      return;
    }

    isLogged = true;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const contentLength = nodeResponse.getHeader("content-length") ?? "-";
    const statusCode = nodeResponse.statusCode || 0;
    const method = nodeRequest.method ?? "UNKNOWN";
    const target = nodeRequest.url ?? "/";
    const clientAddress = getClientAddress(nodeRequest);

    console.log(
      `${clientAddress} - "${method} ${target}" ${statusCode} ${contentLength} ${durationMs.toFixed(1)}ms ${eventName}`
    );
  };

  nodeResponse.on("finish", () => logRequest("finish"));
  nodeResponse.on("close", () => logRequest("close"));
}

async function sendFetchResponse(response, nodeResponse) {
  nodeResponse.statusCode = response.status;

  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

  if (!response.body || response.status === 204 || response.status === 304) {
    nodeResponse.end();
    return;
  }

  await writeReadableStreamToWritable(response.body, nodeResponse);
}

function resolveStaticPath(rootDirectory, pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(rootDirectory, relativePath);

  if (!absolutePath.startsWith(rootDirectory)) {
    return null;
  }

  return absolutePath;
}

async function serveStaticFile(nodeRequest, nodeResponse, absolutePath, maxAge) {
  try {
    const fileStats = await stat(absolutePath);

    if (!fileStats.isFile()) {
      return false;
    }

    nodeResponse.statusCode = 200;
    nodeResponse.setHeader("Cache-Control", `public, max-age=${maxAge}`);
    nodeResponse.setHeader("Content-Length", fileStats.size);
    nodeResponse.setHeader("Content-Type", getContentType(absolutePath));

    if (nodeRequest.method === "HEAD") {
      nodeResponse.end();
      return true;
    }

    await pipeline(createReadStream(absolutePath), nodeResponse);
    return true;
  } catch (error) {
    if ((error).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function maybeServeStaticAsset(nodeRequest, nodeResponse) {
  const requestUrl = new URL(nodeRequest.url ?? "/", "http://localhost");

  if (requestUrl.pathname.startsWith("/assets/")) {
    const assetPath = resolveStaticPath(clientBuildDirectory, requestUrl.pathname);

    if (assetPath) {
      return serveStaticFile(nodeRequest, nodeResponse, assetPath, 31536000);
    }
  }

  const buildFilePath = resolveStaticPath(clientBuildDirectory, requestUrl.pathname);

  if (buildFilePath) {
    try {
      await access(buildFilePath);
      return serveStaticFile(nodeRequest, nodeResponse, buildFilePath, 3600);
    } catch (error) {
      if ((error).code !== "ENOENT") {
        throw error;
      }
    }
  }

  const publicFilePath = resolveStaticPath(publicDirectory, requestUrl.pathname);

  if (publicFilePath) {
    return serveStaticFile(nodeRequest, nodeResponse, publicFilePath, 3600);
  }

  return false;
}

const server = createServer(async (nodeRequest, nodeResponse) => {
  attachAccessLog(nodeRequest, nodeResponse);

  try {
    if (await maybeServeStaticAsset(nodeRequest, nodeResponse)) {
      return;
    }

    const request = createFetchRequest(nodeRequest, nodeResponse);
    const response = await handleRequest(request, {
      waitUntil() {},
    });

    await sendFetchResponse(response, nodeResponse);
  } catch (error) {
    console.error("self-hosted server failed", error);

    if (!nodeResponse.headersSent) {
      nodeResponse.statusCode = 500;
      nodeResponse.setHeader("Content-Type", "text/plain; charset=utf-8");
    }

    nodeResponse.end("Internal Server Error");
  }
});

const shutdownTimeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? "10000");
let isShuttingDown = false;
let shutdownTimer = null;

function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down HTTP server`);

  shutdownTimer = setTimeout(() => {
    console.error("HTTP server shutdown timed out");

    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }

    process.exit(1);
  }, shutdownTimeoutMs);

  shutdownTimer.unref();

  server.close((error) => {
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }

    if (error) {
      console.error("Failed to shut down HTTP server cleanly", error);
      process.exit(1);
      return;
    }

    console.log("HTTP server stopped");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.listen(port, host, () => {
  console.log(`JSON Hero listening on http://${host}:${port}`);
});
