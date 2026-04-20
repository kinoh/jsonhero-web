function getNodeEnvironmentValue(name: string) {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env[name];
}

function getRequiredBinding(name: string) {
  const value = (globalThis as Record<string, unknown>)[name];

  if (value == null) {
    const environmentValue = getNodeEnvironmentValue(name);

    if (environmentValue == null) {
      throw new Error(`${String(name)} is not defined`);
    }

    return environmentValue;
  }

  return value;
}

export function setGlobalBindings(env: Record<string, unknown>) {
  const globals = globalThis as Record<string, unknown>;

  globals.DOCUMENTS = env.DOCUMENTS;
  globals.SESSION_SECRET = env.SESSION_SECRET;
  globals.GRAPH_JSON_COLLECTION = env.GRAPH_JSON_COLLECTION;
  globals.GRAPH_JSON_API_KEY = env.GRAPH_JSON_API_KEY;
  globals.APIHERO_PROJECT_KEY = env.APIHERO_PROJECT_KEY;
  globals.JSONHERO_DISABLE_OUTBOUND_NETWORK =
    env.JSONHERO_DISABLE_OUTBOUND_NETWORK;
}

export function getDocuments() {
  return getRequiredBinding("DOCUMENTS") as KVNamespace;
}

export function getSessionSecret() {
  return getRequiredBinding("SESSION_SECRET") as string;
}

export function getApiheroProjectKey() {
  const value = (globalThis as Record<string, unknown>).APIHERO_PROJECT_KEY;

  return typeof value === "string" ? value : undefined;
}

export function isOutboundNetworkDisabled() {
  const value =
    (globalThis as Record<string, unknown>).JSONHERO_DISABLE_OUTBOUND_NETWORK ??
    getNodeEnvironmentValue("JSONHERO_DISABLE_OUTBOUND_NETWORK");

  return value === "1";
}

export function isLoopbackHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

export function requiresOutboundNetwork(url: URL) {
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    !isLoopbackHostname(url.hostname)
  );
}

function resolveRequestUrl(input: RequestInfo | URL) {
  if (input instanceof URL) {
    return input;
  }

  if (typeof input === "string") {
    return URL.canParse(input) ? new URL(input) : undefined;
  }

  return new URL(input.url);
}

export function assertOutboundNetworkAllowed(input: RequestInfo | URL) {
  if (!isOutboundNetworkDisabled()) {
    return;
  }

  const url = resolveRequestUrl(input);

  if (!url) {
    return;
  }

  if (requiresOutboundNetwork(url)) {
    throw new Error(
      `Outbound network requests are disabled: ${url.origin}${url.pathname}`
    );
  }
}
