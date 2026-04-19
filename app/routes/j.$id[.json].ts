import { data } from "react-router";
import invariant from "tiny-invariant";
import { getDocument } from "~/jsonDoc.server";

export const loader = async ({
  params,
  request,
}: {
  params: { id?: string };
  request: Request;
}) => {
  invariant(params.id, "expected params.id");

  const doc = await getDocument(params.id);

  if (!doc) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  if (doc.type == "url") {
    const jsonResponse = await fetch(doc.url);
    return jsonResponse.json();
  } else {
    return data(JSON.parse(doc.contents));
  }
};
