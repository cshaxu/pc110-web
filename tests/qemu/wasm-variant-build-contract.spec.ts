import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const scriptsDirectory = resolve(testDirectory, "../../scripts/qemu-build");
const dependencies = readFileSync(resolve(scriptsDirectory, "build-wasm-dependencies-gitbash.sh"), "utf8");
const configure = readFileSync(resolve(scriptsDirectory, "configure-qemu-wasm-gitbash.sh"), "utf8");
const cleanBuild = readFileSync(resolve(scriptsDirectory, "clean-qemu-wasm-variant-gitbash.sh"), "utf8");
const setupBuild = readFileSync(resolve(scriptsDirectory, "run-setup-build.sh"), "utf8");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const script of [dependencies, configure, cleanBuild, setupBuild]) {
  assert(script.includes("wasm_variant=wasm64") || script.includes("variant=wasm64"), "Every build entrypoint must select wasm64 explicitly.");
}
assert(!dependencies.includes("wasm32-unknown-emscripten"), "Dependencies must not expose a wasm32 target triple.");
assert(dependencies.includes("wasm64-unknown-emscripten"), "Dependencies must retain the wasm64 target triple.");
assert(dependencies.includes("emscripten-$wasm_variant.cross"), "Dependency cross files must remain wasm64-specific.");
assert(dependencies.includes('host_venv/bin/python.exe'), "Dependency setup must support Git Bash virtual-environment layouts.");
assert(dependencies.includes('em_cache_dir="$work_dir/em-cache"'), "Emscripten cache must remain inside the wasm64 dependency work directory.");
assert(configure.includes('--cpu="$wasm_variant"'), "QEMU configuration must select wasm64 explicitly.");
assert(cleanBuild.includes('run-setup-build.sh" "$variant"'), "Clean builds must use the wasm64 cache stage.");
assert(setupBuild.includes("removing incomplete PC110 WASM source"), "A failed source copy must be retryable inside the wasm64 cache.");

console.log("wasm-variant-build-contract=ok");