export type RuntimeAbi = "wasm64";

const memory64Probe = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x05, 0x03, 0x01, 0x04, 0x00
]);

export function supportsMemory64(): boolean {
  return typeof WebAssembly !== "undefined" && WebAssembly.validate(memory64Probe);
}

export function selectRuntimeAbi(): RuntimeAbi {
  return "wasm64";
}

export function runtimeArtifactPath(): string {
  return "qemu-system-i386.js";
}