import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";

let remoteJsonServer: Server;
let remoteJsonUrl: string;

test.beforeAll(async () => {
  remoteJsonServer = createServer((request, response) => {
    if (request.url === "/fixture.json") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ remote: true, source: "fixture" }));
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
  });

  await new Promise<void>((resolve) => {
    remoteJsonServer.listen(0, "127.0.0.1", () => resolve());
  });

  const address = remoteJsonServer.address() as AddressInfo;
  remoteJsonUrl = `http://127.0.0.1:${address.port}/fixture.json`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    remoteJsonServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Paste JSON or drop a file" })
  ).toBeVisible();
});

test("creates a document from pasted JSON, updates its title, and deletes it", async ({
  page,
  request,
}) => {
  await openCreatedDocument(
    page,
    await createRawJsonDocument(request, { greeting: "hello" })
  );

  const titleInput = page.getByPlaceholder("Name your JSON file");
  await expect(titleInput).toBeVisible();
  const createdDocumentResponse = await page.request.get(
    `${getDocumentUrl(page)}.json`
  );
  expect(createdDocumentResponse.ok()).toBeTruthy();
  expect(await createdDocumentResponse.json()).toEqual({ greeting: "hello" });

  await titleInput.fill("Updated title");
  const updateDocumentResponse = await page.request.post(
    `${getDocumentUrl(page).replace("/j/", "/actions/")}/update`,
    {
      form: {
        title: "Updated title",
      },
    }
  );
  expect(updateDocumentResponse.ok()).toBeTruthy();
  await page.reload();
  await expect(page.locator('input[value="Updated title"]')).toBeVisible();

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Paste JSON or drop a file" })
  ).toBeVisible();
});

test("creates a document from an uploaded file and exposes the JSON download", async ({
  page,
  request,
}) => {
  await openCreatedDocument(
    page,
    await createUploadedJsonDocument(request, {
      uploaded: true,
      source: "file",
    })
  );

  await expect(page).toHaveURL(/\/j\/[^/]+$/);
  await expect(page.locator('input[value="uploaded.json"]')).toBeVisible();

  await page.getByRole("link", { name: "JSON view" }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.locator("pre, .cm-content").first()).toContainText(
    '"uploaded": true'
  );

  const response = await page.request.get(`${getDocumentUrl(page)}.json`);
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({
    uploaded: true,
    source: "file",
  });
});

test("creates a document from a remote JSON URL and navigates between views", async ({
  page,
  request,
}) => {
  await openCreatedDocument(page, await createRemoteDocument(request, remoteJsonUrl));

  await expect(page).toHaveURL(/\/j\/[^/]+$/);
  await expect(page.locator('input[value="fixture.json"]')).toBeVisible();

  await page.getByRole("link", { name: "Tree view" }).click();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(page.locator('input[value="fixture.json"]')).toBeVisible();

  const response = await page.request.get(`${getDocumentUrl(page)}.json`);
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({
    remote: true,
    source: "fixture",
  });
});

async function openCreatedDocument(page: Page, location: string) {
  await expect
    .poll(async () => {
      const response = await page.request.get(`${location}.json`);
      return response.status();
    })
    .toBe(200);

  await page.goto(location);
  await expect(page).toHaveURL(/\/j\/[^/]+$/);
}

async function createRawJsonDocument(
  request: APIRequestContext,
  payload: Record<string, unknown>
) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  return createDocumentFromPath(request, `/new?j=${encodeURIComponent(encoded)}`);
}

async function createUploadedJsonDocument(
  request: APIRequestContext,
  payload: Record<string, unknown>
) {
  const response = await request.post("/actions/createFromFile", {
    form: {
      filename: "uploaded.json",
      rawJson: JSON.stringify(payload),
    },
    maxRedirects: 0,
  });

  return getRedirectLocation(response);
}

async function createRemoteDocument(
  request: APIRequestContext,
  url: string
) {
  return createDocumentFromPath(
    request,
    `/new?url=${encodeURIComponent(url)}&title=${encodeURIComponent("fixture.json")}`
  );
}

async function createDocumentFromPath(
  request: APIRequestContext,
  path: string
) {
  const response = await request.get(path, { maxRedirects: 0 });
  return getRedirectLocation(response);
}

function getRedirectLocation(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  const location = response.headers()["location"];

  if (!location) {
    throw new Error("Expected redirect location");
  }

  return location;
}

function getDocumentUrl(page: Page) {
  return page.url().replace(/\/(editor|tree|terminal)$/, "");
}
