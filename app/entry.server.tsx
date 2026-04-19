import {
  ServerRouter,
  isRouteErrorResponse,
  type EntryContext,
} from "react-router";
import ReactDOMServerBrowser from "react-dom/server.browser";

const { renderToReadableStream } = ReactDOMServerBrowser;

export const streamTimeout = 5_000;

export function handleError(error: unknown) {
  if (isRouteErrorResponse(error) && error.status < 500) {
    return;
  }

  console.error(error);
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  let shellRendered = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), streamTimeout + 1_000);

  try {
    const stream = await renderToReadableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        signal: controller.signal,
        onError(error: unknown) {
          responseStatusCode = 500;

          if (shellRendered) {
            handleError(error);
          }
        },
      }
    );

    shellRendered = true;

    if (routerContext.isSpaMode) {
      await stream.allReady;
    }

    responseHeaders.set("Content-Type", "text/html");

    return new Response(stream, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
