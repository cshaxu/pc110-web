export type RuntimeAbi = "wasm32" | "wasm64";

export function selectRuntimeAbi(userAgent: string): RuntimeAbi {
  const safari = /Version\/(\d+(?:\.\d+)?).*Safari\//.exec(userAgent);
  if (safari && Number.parseFloat(safari[1] ?? "0") >= 26) return "wasm32";
  return "wasm64";
}

export function runtimeArtifactPath(abi: RuntimeAbi): string {
  return abi === "wasm64" ? "qemu-system-i386.js" : "wasm32/qemu-system-i386.js";
}
