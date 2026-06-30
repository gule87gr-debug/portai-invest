import { readFile, stat, realpath } from "node:fs/promises";
import { resolve, isAbsolute, normalize, relative, sep } from "node:path";
import { homedir } from "node:os";

/** Cap to avoid blowing up the model context with huge files. */
const MAX_BYTES = 1_000_000; // 1 MB

/**
 * Allow-list of root directories the tool may read from.
 * Override with MCP_READ_ROOTS (colon-separated absolute paths).
 * Defaults to the user's home directory only.
 */
function getAllowedRoots(): string[] {
  const raw = process.env.MCP_READ_ROOTS;
  const roots = raw
    ? raw.split(":").map((p) => p.trim()).filter(Boolean)
    : [homedir()];

  return roots
    .filter((p) => isAbsolute(p))
    .map((p) => resolve(normalize(p)));
}

/** Reject paths containing NUL bytes or traversal segments before resolving. */
function assertNoTraversalTokens(input: string): void {
  if (input.includes("\0")) {
    throw new Error("Invalid path: contains NUL byte");
  }
  const segments = input.split(/[\\/]+/);
  if (segments.includes("..")) {
    throw new Error("Invalid path: parent traversal ('..') is not allowed");
  }
}

/** True iff `child` is `root` or lives inside it. */
function isWithin(child: string, root: string): boolean {
  const rel = relative(root, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export async function readLocalFile(filepath: string): Promise<string> {
  if (typeof filepath !== "string" || filepath.trim() === "") {
    throw new Error("filepath must be a non-empty string");
  }

  assertNoTraversalTokens(filepath);

  // Resolve to an absolute, normalized path against CWD.
  const requested = resolve(normalize(filepath));

  const allowedRoots = getAllowedRoots();
  if (allowedRoots.length === 0) {
    throw new Error("No allowed read roots configured");
  }

  // Reject before touching the filesystem if it's obviously outside the allow-list.
  const lexicallyAllowed = allowedRoots.some((root) => isWithin(requested, root));
  if (!lexicallyAllowed) {
    throw new Error(
      `Access denied: path is outside the allowed roots (${allowedRoots.join(", ")})`
    );
  }

  // Resolve symlinks and re-check, so a symlink inside an allowed root
  // cannot point at /etc/passwd or similar.
  let realPath: string;
  try {
    realPath = await realpath(requested);
  } catch {
    throw new Error(`File not found: ${requested}`);
  }

  const realAllowed = allowedRoots.some((root) => isWithin(realPath, root));
  if (!realAllowed) {
    throw new Error("Access denied: resolved path escapes the allowed roots");
  }

  const info = await stat(realPath);
  if (!info.isFile()) {
    throw new Error(`Not a regular file: ${realPath}`);
  }
  if (info.size > MAX_BYTES) {
    throw new Error(
      `File too large (${info.size} bytes, max ${MAX_BYTES}): ${realPath}`
    );
  }

  // Final safety: ensure we never read across the OS root accidentally.
  if (!realPath.startsWith(sep) && !/^[A-Za-z]:\\/.test(realPath)) {
    throw new Error("Resolved path is not absolute");
  }

  return await readFile(realPath, "utf8");
}
