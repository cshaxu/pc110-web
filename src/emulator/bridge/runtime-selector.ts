export type RuntimeAbi = "wasm32" | "wasm64";

export function selectRuntimeAbi(_userAgent: string): RuntimeAbi {
  // QEMU's system emulator requires a 64-bit host address model. A compiled
  // wasm32 artifact can load and draw its first frame, but fails immediately
  // in the PC110 boot path. Keep the known-good wasm64 runtime authoritative
  // until a full 32-bit-host port has runtime evidence.
  return "wasm64";
}

export function runtimeArtifactPath(abi: RuntimeAbi): string {
  return abi === "wasm64" ? "qemu-system-i386.js" : "wasm32/qemu-system-i386.js";
}
