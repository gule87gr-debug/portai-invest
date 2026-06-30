import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

/** Cap to avoid blowing up the model context with huge files. */
const MAX_BYTES = 1_000_000; // 1 MB

export async function readLocalFile(filepath: string): Promise<string> {
  const abs = resolve(filepath);

  const info = await stat(abs).catch(() => {
    throw new Error(`File not found: ${abs}`);
  });

  if (!info.isFile()) {
    throw new Error(`Not a regular file: ${abs}`);
  }
  if (info.size > MAX_BYTES) {
    throw new Error(
      `File too large (${info.size} bytes, max ${MAX_BYTES}): ${abs}`
    );
  }

  return await readFile(abs, "utf8");
}
