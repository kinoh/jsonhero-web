import { data } from "react-router";
import invariant from "tiny-invariant";
import { sendEvent } from "~/graphJSON.server";
import { updateDocument } from "~/jsonDoc.server";

export const action = async ({
  params,
  request,
  context,
}: {
  params: { id?: string };
  request: Request;
  context: { waitUntil(promise: Promise<unknown>): void };
}) => {
  invariant(params.id, "expected params.id");

  const title = (await request.formData()).get("title");

  invariant(typeof title === "string", "expected title");

  try {
    const document = await updateDocument(params.id, title);

    if (!document) return data({ error: "No document with that slug" });

    context.waitUntil(
      sendEvent({
        type: "update-doc",
        id: document.id,
        title,
      })
    );

    return data(document);
  } catch (error) {
    if (error instanceof Error) {
      return data({ error: error.message });
    } else {
      return data({ error: "Unknown error" });
    }
  }
};
