import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createStaticServer } from "../scripts/serve.mjs";

test("preview serves public files and rejects lexical or symlink escapes", async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), "carbon-commons-server-"));
  const publicRoot = path.join(fixture, "dist");
  await mkdir(publicRoot);
  await mkdir(path.join(publicRoot, "assets"));
  await mkdir(path.join(fixture, "dist-private"));
  await writeFile(
    path.join(publicRoot, "index.html"),
    "<h1>Public fixture</h1>",
  );
  await writeFile(
    path.join(publicRoot, "assets", "code.js"),
    "export const answer=42;",
  );
  await writeFile(
    path.join(publicRoot, "assets", "font.woff2"),
    "wOF2 synthetic fixture",
  );
  await writeFile(
    path.join(publicRoot, "assets", "LICENSE.txt"),
    "Synthetic license fixture",
  );
  await writeFile(
    path.join(fixture, "private.txt"),
    "Synthetic outside-root fixture",
  );
  await writeFile(
    path.join(fixture, "dist-private", "private.txt"),
    "Synthetic sibling fixture",
  );
  await symlink("../private.txt", path.join(publicRoot, "outside.txt"));
  await symlink("assets/code.js", path.join(publicRoot, "inside.js"));
  const server = createStaticServer(publicRoot);
  t.after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(fixture, { recursive: true, force: true });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const root = await fetch(base + "/");
  assert.equal(root.status, 200);
  assert.match(root.headers.get("content-type"), /^text\/html/);
  assert.equal(root.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await root.text(), "<h1>Public fixture</h1>");
  for (const file of ["/assets/code.js", "/inside.js"]) {
    const response = await fetch(base + file);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/javascript/);
    assert.equal(await response.text(), "export const answer=42;");
  }
  for (const [file, mime] of [
    ["/assets/font.woff2", "font/woff2"],
    ["/assets/LICENSE.txt", "text/plain; charset=utf-8"],
  ]) {
    const response = await fetch(base + file);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), mime);
  }
  for (const file of [
    "/..%2Fprivate.txt",
    "/..%2Fdist-private%2Fprivate.txt",
    "/outside.txt",
  ]) {
    const response = await fetch(base + file);
    assert.equal(response.status, 403, file);
    assert.doesNotMatch(await response.text(), /Synthetic/);
  }
  for (const file of ["/missing.txt", "/%E0%A4%A"]) {
    const response = await fetch(base + file);
    assert.equal(response.status, 404, file);
    assert.equal(await response.text(), "Not found");
  }
  const head = await fetch(base + "/assets/code.js", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
