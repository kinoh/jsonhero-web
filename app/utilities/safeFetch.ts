import { assertOutboundNetworkAllowed } from "~/environment.server";

export default function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  assertOutboundNetworkAllowed(url);

  return fetch(url, {
    ...options,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      ...options.headers,
    },
  });
}
