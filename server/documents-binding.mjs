import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

function encodeKey(key) {
  return Buffer.from(key).toString("base64url");
}

function resolveRecordPath(rootDir, key) {
  const encodedKey = encodeKey(key);
  const shard = encodedKey.slice(0, 2) || "__";

  return path.join(rootDir, shard, `${encodedKey}.json`);
}

async function readRecord(recordPath) {
  try {
    const raw = await readFile(recordPath, "utf8");
    const record = JSON.parse(raw);

    if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
      await rm(recordPath, { force: true });
      return null;
    }

    return record;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export function createNodeDocumentsBinding(rootDir) {
  const storageRoot = path.resolve(rootDir);

  return {
    async delete(key) {
      await rm(resolveRecordPath(storageRoot, key), { force: true });
    },

    async get(key) {
      const record = await readRecord(resolveRecordPath(storageRoot, key));

      return record?.value ?? null;
    },

    async put(key, value, options = {}) {
      const recordPath = resolveRecordPath(storageRoot, key);
      const expiresAt =
        typeof options.expirationTtl === "number"
          ? new Date(Date.now() + options.expirationTtl * 1000).toISOString()
          : undefined;

      await mkdir(path.dirname(recordPath), { recursive: true });
      await writeFile(
        recordPath,
        JSON.stringify({
          expiresAt,
          metadata: options.metadata,
          value,
        }),
        "utf8"
      );
    },
  };
}
