import { createRequestHandler } from "react-router";
import {
  assertOutboundNetworkAllowed,
  isOutboundNetworkDisabled,
} from "../app/environment.server";

import * as build from "../build/server/server/index.js";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV);

function setGlobalBindings(env) {
  globalThis.DOCUMENTS = env.DOCUMENTS;
  globalThis.SESSION_SECRET = env.SESSION_SECRET;
  globalThis.GRAPH_JSON_COLLECTION = env.GRAPH_JSON_COLLECTION;
  globalThis.GRAPH_JSON_API_KEY = env.GRAPH_JSON_API_KEY;
  globalThis.APIHERO_PROJECT_KEY = env.APIHERO_PROJECT_KEY;
  globalThis.JSONHERO_DISABLE_OUTBOUND_NETWORK =
    env.JSONHERO_DISABLE_OUTBOUND_NETWORK;
}

const originalFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = (input, init) => {
  if (isOutboundNetworkDisabled()) {
    assertOutboundNetworkAllowed(input);
  }

  return originalFetch(input, init);
};

export default {
  async fetch(request, env, ctx) {
    setGlobalBindings(env);

    try {
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
