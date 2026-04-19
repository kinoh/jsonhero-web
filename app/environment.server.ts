function getRequiredBinding(name: string) {
  const value = (globalThis as Record<string, unknown>)[name];

  if (value == null) {
    throw new Error(`${String(name)} is not defined`);
  }

  return value;
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
