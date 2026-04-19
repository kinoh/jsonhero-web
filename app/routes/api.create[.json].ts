import {
  data,
} from "react-router";
import invariant from "tiny-invariant";
import { sendEvent } from "~/graphJSON.server";
import { createFromRawJson, CreateJsonOptions } from "~/jsonDoc.server";

export const loader = async ({
  request,
}: {
  request: Request;
}) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
};

export const action = async ({
  request,
  context,
}: {
  request: Request;
  context: { waitUntil(promise: Promise<unknown>): void };
}) => {
  const url = new URL(request.url);
  const body = (await request.json()) as {
    title?: unknown;
    content?: unknown;
    ttl?: unknown;
    readOnly?: unknown;
  };
  const { title, content, ttl, readOnly } = body;

  if (!title || !content) {
    return data({ message: "Missing title or content" }, 400);
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(content !== null, "content cannot be null");

  const source = url.searchParams.get("utm_source");

  const options: CreateJsonOptions = {};

  if (typeof ttl === "number") {
    if (ttl < 60) {
      return data({ message: "ttl must be at least 60 seconds" }, 400);
    }

    options.ttl = ttl;
  }

  if (typeof readOnly === "boolean") {
    options.readOnly = readOnly;
  }

  const doc = await createFromRawJson(title, JSON.stringify(content), options);
  url.pathname = `/j/${doc.id}`;

  url.searchParams.delete("utm_source");

  context.waitUntil(
    sendEvent({
      type: "create",
      from: "url",
      hostname: url.hostname,
      id: doc.id,
      source,
    })
  );

  return data(
    { id: doc.id, title, location: url.toString() },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};
