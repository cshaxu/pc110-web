import {
  PC110_BRIDGE_VERSION,
  Pc110Session,
  buildPc110LaunchPlan,
  type LocalAsset
} from "../bridge/pc110-session.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function asset(name: string, byte: number): LocalAsset {
  return { name, bytes: new Uint8Array([byte]) };
}

const files = {
  bios: asset("unsafe,argument.bin", 1),
  fontRom: asset("font.bin", 2),
  disk: asset("disk.img", 3)
};

const plan = buildPc110LaunchPlan(files);
assert(plan.bridgeVersion === PC110_BRIDGE_VERSION, "bridge version must be explicit");
assert(plan.files["/pc110-input/pc110_bios.bin"] === files.bios.bytes, "BIOS must use the fixed VFS path");
assert(plan.arguments.includes("pc110-chipset,biosfile=/pc110-input/pc110_bios.bin,vgac000=on"), "chipset argument is missing");
assert(!plan.arguments.join(" ").includes(files.bios.name), "user file names must not enter QEMU arguments");

const easySetup = asset("easysetup.bin", 4);
const setupPlan = buildPc110LaunchPlan({ ...files, easySetup });
assert(setupPlan.files["/pc110-input/easysetup.bin"] === easySetup.bytes, "Easy-Setup must use the fixed VFS path");

const states: string[] = [];
let receivedArguments: readonly string[] = [];
let receivedFiles: Readonly<Record<string, Uint8Array>> = {};

const session = new Pc110Session(
  {
    moduleFactory(request) {
      receivedArguments = request.arguments;
      receivedFiles = request.files;
      return {};
    }
  },
  { onStateChange: (state) => states.push(state) }
);

await session.start(files);
assert(session.getState() === "running", "session must enter running after module initialization");
assert(Object.keys(receivedFiles).length === 3, "factory must receive all local files for Emscripten pre-run setup");
assert(receivedArguments === plan.arguments || receivedArguments.join("\u0000") === plan.arguments.join("\u0000"), "factory must receive the launch plan");
await session.dispose();
assert(session.getState() === "disposed", "session must dispose cleanly");
assert(states.join(",") === "preparing,running,disposed", "session lifecycle must be observable");

const failedSession = new Pc110Session({
  moduleFactory() {
    throw new Error("module initialization failed");
  }
});

let failureObserved = false;
try {
  await failedSession.start(files);
} catch {
  failureObserved = true;
}
assert(failureObserved, "initialization failures must be reported");
assert(failedSession.getState() === "failed", "failed initialization must expose failed state");

console.log("pc110-session-contract=ok");
