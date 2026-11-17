import type { Storage } from "../worker/api";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
// Checkout-local development storage. The deployed preview uses a dedicated KV namespace.
export function devStorage(root: string): Storage {
  return {
    async get(key: string) {
      try {
        const record = JSON.parse(
          await readFile(join(root, encodeURIComponent(key) + ".json"), "utf8"),
        );
        return record.expires && record.expires < Date.now()
          ? null
          : record.value;
      } catch {
        return null;
      }
    },
    async put(key: string, value: string, options?: { expirationTtl: number }) {
      await mkdir(root, { recursive: true });
      const path = join(root, encodeURIComponent(key) + ".json"),
        temp = path + "." + crypto.randomUUID() + ".tmp";
      await writeFile(
        temp,
        JSON.stringify({
          value: JSON.parse(value),
          expires: options ? Date.now() + options.expirationTtl * 1000 : 0,
        }),
      );
      await rename(temp, path);
    },
  };
}
