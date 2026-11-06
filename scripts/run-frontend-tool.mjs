import { existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let safeRoot;
let cleanup = () => {};
if (process.platform === "win32") {
  const drive = ["V:", "W:", "X:", "Y:", "Z:"].find((candidate) => !existsSync(`${candidate}\\`));
  if (!drive) throw new Error("No free drive letter is available for the Vite path-safety mapping.");
  const mapped = spawnSync("subst", [drive, projectRoot], { stdio: "inherit" });
  if (mapped.status !== 0) process.exit(mapped.status ?? 1);
  safeRoot = `${drive}\\`;
  cleanup = () => spawnSync("subst", [drive, "/d"], { stdio: "ignore" });
} else {
  safeRoot = join(tmpdir(), "academic-certificate-dapp-workspace");
  if (existsSync(safeRoot)) {
    const pointsToProject = lstatSync(safeRoot).isSymbolicLink() && resolve(readlinkSync(safeRoot)) === projectRoot;
    if (!pointsToProject) unlinkSync(safeRoot);
  }
  if (!existsSync(safeRoot)) symlinkSync(projectRoot, safeRoot, "dir");
}

const [tool, ...args] = process.argv.slice(2);
const entrypoints = {
  vite: join(safeRoot, "frontend", "node_modules", "vite", "bin", "vite.js"),
  vitest: join(safeRoot, "frontend", "node_modules", "vitest", "vitest.mjs")
};
if (!entrypoints[tool]) throw new Error(`Unsupported frontend tool: ${tool}`);

const result = spawnSync(process.execPath, [entrypoints[tool], ...args], {
  cwd: join(safeRoot, "frontend"),
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--preserve-symlinks-main"].filter(Boolean).join(" ")
  }
});
cleanup();
process.exit(result.status ?? 1);
