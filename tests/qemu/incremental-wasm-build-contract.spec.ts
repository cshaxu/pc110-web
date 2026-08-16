import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const scriptPath = resolve(testDirectory, "../../scripts/qemu-build/incremental-qemu-wasm-gitbash.sh");
const script = readFileSync(scriptPath, "utf8");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const path of [
  "wasm-deps-$variant",
  "wasm-sysroot-$variant",
  "pc110-wasm-src-$variant",
  "pc110-wasm-build-$variant",
  "pc110-wasm-record-$variant"
]) {
  assert(script.includes(path), `Incremental build must use an isolated wasm64 path: ${path}.`);
}

assert(script.includes("variant=wasm64"), "Incremental QEMU builds must be wasm64-only.");
assert(!script.includes("wasm32"), "Incremental QEMU builds must not expose an invalid wasm32 route.");
assert(script.includes('PC110_WEB_WASM_VARIANT="$variant"'), "The wasm64 ABI must propagate into incremental linking.");
assert(script.includes("build-configured-qemu-wasm-gitbash.sh"), "Incremental build must reuse the configured Ninja graph.");
assert(!script.includes("build-wasm-dependencies-gitbash.sh"), "Incremental build must not rebuild dependencies.");
assert(!script.includes("prepare-pc110-wasm-source-gitbash.sh"), "Incremental build must not recreate prepared source.");

console.log("incremental-wasm-build-contract=ok");