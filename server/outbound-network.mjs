function isLoopbackHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function resolveRequestUrl(input) {
  if (input instanceof URL) {
    return input;
  }

  if (typeof input === "string") {
    return URL.canParse(input) ? new URL(input) : undefined;
  }

  return new URL(input.url);
}

export function assertOutboundNetworkAllowed(input) {
  if (process.env.JSONHERO_DISABLE_OUTBOUND_NETWORK !== "1") {
    return;
  }

  const url = resolveRequestUrl(input);

  if (!url) {
    return;
  }

  if (
    (url.protocol === "http:" || url.protocol === "https:") &&
    !isLoopbackHostname(url.hostname)
  ) {
    throw new Error(
      `Outbound network requests are disabled: ${url.origin}${url.pathname}`
    );
  }
}
