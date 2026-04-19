import { createRequestHandler } from "@remix-run/cloudflare";
import { handleAsset } from "@remix-run/cloudflare-workers";

import * as build from "../build";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV);

function setGlobalBindings(env) {
  globalThis.DOCUMENTS = env.DOCUMENTS;
  globalThis.SESSION_SECRET = env.SESSION_SECRET;
  globalThis.GRAPH_JSON_COLLECTION = env.GRAPH_JSON_COLLECTION;
  globalThis.GRAPH_JSON_API_KEY = env.GRAPH_JSON_API_KEY;
  globalThis.APIHERO_PROJECT_KEY = env.APIHERO_PROJECT_KEY;
}

async function getAssetResponse(event) {
  try {
    return await handleAsset(event, build);
  } catch (error) {
    if (error instanceof Error && error.message.includes("KV namespace bound")) {
      return null;
    }

    throw error;
  }
}

export default {
  async fetch(request, env, ctx) {
    setGlobalBindings(env);

    const event = {
      request,
      waitUntil(promise) {
        return ctx.waitUntil(promise);
      },
    };

    try {
      const assetResponse = await getAssetResponse(event);

      if (assetResponse) {
        return assetResponse;
      }

      return await handleRequest(request, {
        waitUntil(promise) {
          return ctx.waitUntil(promise);
        },
      });
    } catch (error) {
      console.error("worker fetch failed", error);
      throw error;
    }
  },
};
