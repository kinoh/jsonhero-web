import { expect, test, type Page } from "@playwright/test";
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
}) => {
  await createDocumentFromInput(page, JSON.stringify({ greeting: "hello" }));

  await expect(page.getByRole("heading", { name: "greeting" })).toBeVisible();
  const createdDocumentResponse = await page.request.get(
    `${getDocumentUrl(page)}.json`
  );
  expect(createdDocumentResponse.ok()).toBeTruthy();
  expect(await createdDocumentResponse.json()).toEqual({ greeting: "hello" });

  const titleInput = page.getByPlaceholder("Name your JSON file");
  await titleInput.fill("Updated title");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(titleInput).toHaveValue("Updated title");

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
}) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "uploaded.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ uploaded: true, source: "file" })),
  });

  await expect(page).toHaveURL(/\/j\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "uploaded" })).toBeVisible();

  await page.getByRole("link", { name: "JSON view" }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.locator(".cm-content")).toContainText('"uploaded": true');

  const response = await page.request.get(`${getDocumentUrl(page)}.json`);
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({
    uploaded: true,
    source: "file",
  });
});

test("creates a document from a remote JSON URL and navigates between views", async ({
  page,
}) => {
  await createDocumentFromInput(page, remoteJsonUrl);

  await expect(page).toHaveURL(/\/j\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "remote" })).toBeVisible();

  await page.getByRole("link", { name: "Tree view" }).click();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(page.getByRole("heading", { name: "remote" })).toBeVisible();

  const response = await page.request.get(`${getDocumentUrl(page)}.json`);
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({
    remote: true,
    source: "fixture",
  });
});

async function createDocumentFromInput(page: Page, value: string) {
  await page
    .getByPlaceholder("Enter a JSON URL or paste in JSON here...")
    .fill(value);
  await page.getByRole("button", { name: "Go" }).click();
  await expect(page).toHaveURL(/\/j\/[^/]+$/);
}

function getDocumentUrl(page: Page) {
  return page.url().replace(/\/(editor|tree|terminal)$/, "");
}
