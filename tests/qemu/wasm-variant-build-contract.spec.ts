import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const scriptsDirectory = resolve(testDirectory, "../../scripts/qemu-build");
const dependencies = readFileSync(resolve(scriptsDirectory, "build-wasm-dependencies-gitbash.sh"), "utf8");
const configure = readFileSync(resolve(scriptsDirectory, "configure-qemu-wasm-gitbash.sh"), "utf8");
const cleanVariant = readFileSync(resolve(scriptsDirectory, "clean-qemu-wasm-variant-gitbash.sh"), "utf8");
const setupBuild = readFileSync(resolve(scriptsDirectory, "run-setup-build.sh"), "utf8");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(dependencies.includes("wasm32-unknown-emscripten"), "wasm32 must use its own libffi target triple.");
assert(dependencies.includes("wasm64-unknown-emscripten"), "wasm64 must retain its own libffi target triple.");
assert(dependencies.includes("emscripten-$wasm_variant.cross"), "Dependency cross files must be ABI-specific.");
assert(dependencies.includes('host_venv/bin/python.exe'), "Dependency setup must support Git Bash virtual-environment layouts.");
assert(configure.includes('--cpu="$wasm_variant"'), "QEMU configuration must select the explicit ABI.");
assert(cleanVariant.includes('PC110_WEB_WASM_VARIANT="$variant"'), "Clean variant build must propagate the ABI explicitly.");
assert(cleanVariant.includes('run-setup-build.sh" "$variant"'), "Clean variant build must use an ABI-named cache stage.");
assert(setupBuild.includes("removing incomplete PC110 WASM source"), "A failed source copy must be retryable inside the same variant cache.");

console.log("wasm-variant-build-contract=ok");
