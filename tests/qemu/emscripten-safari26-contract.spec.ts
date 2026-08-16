import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const patchPath = resolve(testDirectory, "../../qemu/patches/0004-emscripten-propagate-compile-define.patch");
const patch = readFileSync(patchPath, "utf8");

if (!patch.includes("-sMIN_SAFARI_VERSION=260000")) {
  throw new Error("The Emscripten browser artifact must target Safari 26.0 and later.");
}

console.log("emscripten-safari26-contract=ok");
