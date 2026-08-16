import { runtimeArtifactPath, selectRuntimeAbi, supportsMemory64 } from "../../src/emulator/bridge/runtime-selector";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(selectRuntimeAbi() === "wasm64", "The project must select only the authoritative wasm64 runtime.");
assert(runtimeArtifactPath() === "qemu-system-i386.js", "wasm64 must use the authoritative runtime artifact.");
assert(typeof supportsMemory64() === "boolean", "Memory64 support detection must be available before loading the emulator.");
console.log("runtime-selector=ok");