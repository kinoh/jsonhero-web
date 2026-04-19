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
