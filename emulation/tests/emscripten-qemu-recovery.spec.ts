import { createEmscriptenQemuBridge, type EmscriptenQemuOptions } from "../bridge/emscripten-qemu.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

let options: EmscriptenQemuOptions | undefined;
let failure = "";
const bridge = createEmscriptenQemuBridge(
  async received => {
    options = received;
    return { FS: { mkdirTree() {}, writeFile() {} }, HEAPU8: new Uint8Array() };
  },
  path => path,
  undefined,
  {},
  message => { failure = message; }
);

await bridge({ bridgeVersion: "1", arguments: [], files: {}, displayTarget: null });
assert(options?.printErr, "Emscripten options must expose stderr recovery");
options.printErr("qemu-system-i386: invalid PC110 parameter");
assert(failure === "PC110 startup failed. Correct the selected files and try Start again.", "QEMU argument errors must restore the caller");
options.printErr("qemu-system-i386: second failure");
assert(failure === "PC110 startup failed. Correct the selected files and try Start again.", "only one failure callback is allowed per launch");

console.log("emscripten-qemu-recovery=ok");
