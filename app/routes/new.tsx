import { redirect } from "react-router";
import invariant from "tiny-invariant";
import {
  isOutboundNetworkDisabled,
  requiresOutboundNetwork,
} from "~/environment.server";
import { sendEvent } from "~/graphJSON.server";
import {
  createFromRawJson,
  createFromUrl,
  CreateJsonOptions,
} from "~/jsonDoc.server";
import {
  commitSession,
  getSession,
  setErrorMessage,
} from "~/services/toast.server";

export let loader = async ({
  request,
  context,
}: {
  request: Request;
  context: { waitUntil(promise: Promise<unknown>): void };
}) => {
  const url = new URL(request.url);
  const toastCookie = await getSession(request.headers.get("cookie"));
  const jsonUrl = url.searchParams.get("url");
  const base64EncodedJson = url.searchParams.get("j");
  const ttl = url.searchParams.get("ttl");
  const readOnly = url.searchParams.get("readonly");
  const title = url.searchParams.get("title");
  const injest = url.searchParams.get("injest");

  if (!jsonUrl && !base64EncodedJson) {
    return redirect("/");
  }

  const options: CreateJsonOptions = {};

  if (typeof ttl === "string") {
    invariant(ttl.match(/^\d+$/), "ttl must be a number");

    options.ttl = parseInt(ttl, 10);

    invariant(options.ttl >= 60, "ttl must be at least 60 seconds");
  }

  if (typeof readOnly === "string") {
    options.readOnly = readOnly === "true";
  }

  if (typeof injest === "string") {
    options.injest = injest === "true";
  }

  if (jsonUrl) {
    const jsonURL = new URL(jsonUrl);

    if (isOutboundNetworkDisabled() && requiresOutboundNetwork(jsonURL)) {
      setErrorMessage(
        toastCookie,
        "External URL documents are disabled on this server",
        "Something went wrong"
      );

      return redirect("/", {
        headers: { "Set-Cookie": await commitSession(toastCookie) },
      });
    }

    invariant(jsonURL, "url must be a valid URL");

    const doc = await createFromUrl(jsonURL, title ?? jsonURL.href, options);

    context.waitUntil(
      sendEvent({
        type: "create",
        from: "url",
        hostname: jsonURL.hostname,
        id: doc.id,
        source: url.searchParams.get("utm_source") ?? url.hostname,
      })
    );

    return redirect(`/j/${doc.id}`);
  }

  if (base64EncodedJson) {
    const doc = await createFromRawJson(
      title ?? "Untitled",
      atob(base64EncodedJson),
      options
    );

    context.waitUntil(
      sendEvent({
        type: "create",
        from: "base64",
        id: doc.id,
        source: url.searchParams.get("utm_source"),
      })
    );

    return redirect(`/j/${doc.id}`);
  }
};
