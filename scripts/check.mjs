import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const directory of ["dist", "scripts"]) {
  const files = await readdir(new URL(`../${directory}/`, import.meta.url));
  for (const file of files.filter((name) => /\.(mjs|js)$/.test(name))) {
    const result = spawnSync(
      process.execPath,
      ["--check", `${directory}/${file}`],
      { cwd: root, stdio: "inherit" },
    );
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
