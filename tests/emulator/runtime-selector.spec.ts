import { runtimeArtifactPath, selectRuntimeAbi } from "../../src/emulator/bridge/runtime-selector";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(selectRuntimeAbi("Mozilla/5.0 Version/26.0 Safari/617.1") === "wasm64", "Safari must retain the proven wasm64 route until the wasm32 host model is ported.");
assert(selectRuntimeAbi("Mozilla/5.0 Version/25.6 Safari/617.1") === "wasm64", "Earlier Safari must retain the default until separately verified.");
assert(selectRuntimeAbi("Mozilla/5.0 Chrome/140.0 Safari/537.36") === "wasm64", "Chromium must use wasm64.");
assert(runtimeArtifactPath("wasm64") === "qemu-system-i386.js", "wasm64 must use the authoritative runtime artifact.");
console.log("runtime-selector=ok");
