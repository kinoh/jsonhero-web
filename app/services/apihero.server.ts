import { createFetchProxy } from "@apihero/fetch";
import { getApiheroProjectKey } from "~/environment.server";

export function fetchProxy(input: RequestInfo | URL, init?: RequestInit) {
  const projectKey = getApiheroProjectKey();

  if (!projectKey) {
    return fetch(input, init);
  }

  return createFetchProxy({
    projectKey,
    env: process.env.NODE_ENV,
  })(input, init);
}
