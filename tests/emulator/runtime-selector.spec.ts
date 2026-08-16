import { runtimeArtifactPath, selectRuntimeAbi } from "../../src/emulator/bridge/runtime-selector";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(selectRuntimeAbi("Mozilla/5.0 Version/26.0 Safari/617.1") === "wasm32", "Safari 26 must choose wasm32.");
assert(selectRuntimeAbi("Mozilla/5.0 Version/25.6 Safari/617.1") === "wasm64", "Earlier Safari must retain the default until separately verified.");
assert(selectRuntimeAbi("Mozilla/5.0 Chrome/140.0 Safari/537.36") === "wasm64", "Chromium must use wasm64.");
assert(selectRuntimeAbi("Mozilla/5.0 Chrome/140.0 Safari/537.36", "wasm32") === "wasm32", "A diagnostic runtime request must exercise wasm32 without changing UA defaults.");
assert(selectRuntimeAbi("Mozilla/5.0 Version/26.0 Safari/617.1", "wasm64") === "wasm64", "A diagnostic runtime request must be explicit and reversible.");
assert(runtimeArtifactPath("wasm32") === "wasm32/qemu-system-i386.js", "wasm32 must use its dedicated artifact directory.");
console.log("runtime-selector=ok");
