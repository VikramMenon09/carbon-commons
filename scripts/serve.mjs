import http from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const defaultRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function isWithin(root, file) {
  const relative = path.relative(root, file);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/** A loopback preview server with lexical and canonical path containment. */
export function createStaticServer(directory = defaultRoot) {
  const root = path.resolve(directory);
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!isWithin(root, file)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      // A lexically safe path may still be a symlink to a private sibling file.
      const canonicalRoot = await realpath(root);
      const canonicalFile = await realpath(file);
      if (!isWithin(canonicalRoot, canonicalFile)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const data = await readFile(canonicalFile);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173);
  const server = createStaticServer();
  server.listen(port, "127.0.0.1", () =>
    console.log(`Carbon Commons: http://127.0.0.1:${server.address().port}`),
  );
}
