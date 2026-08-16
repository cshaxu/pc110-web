import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const patchPath = resolve(testDirectory, "../../qemu/patches/0005-emscripten-web-display.patch");
const patch = readFileSync(patchPath, "utf8");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(
  patch.includes("qemu_input_queue_rel(con, INPUT_AXIS_X, event->movementX);"),
  "The web display patch must route relative X movement from Emscripten movementX."
);
assert(
  patch.includes("qemu_input_queue_rel(con, INPUT_AXIS_Y, event->movementY);"),
  "The web display patch must route relative Y movement from Emscripten movementY."
);
assert(
  !patch.includes("web_display_last_x") && !patch.includes("web_display_last_y"),
  "The web display patch must not derive locked pointer motion from target coordinates."
);
console.log("web-display-pointer-input=ok");
