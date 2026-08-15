import { createEmscriptenQemuBridge, type EmscriptenQemuFactory } from "../bridge/emscripten-qemu";
import { extractPc110EasySetup, Pc110Session, type LocalAsset } from "../session/pc110-session";

const artifactRoot = new URL("/emulator/", window.location.origin);
const localMediaRoot = new URL("/_pc110-local-media/", window.location.origin);
function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`The PC110 page is missing ${selector}.`);
  }
  return element;
}

const status = requiredElement<HTMLParagraphElement>("#status");
const start = requiredElement<HTMLButtonElement>("#start");
const pause = requiredElement<HTMLButtonElement>("#pause");
const restart = requiredElement<HTMLButtonElement>("#restart");
const fullscreen = requiredElement<HTMLButtonElement>("#fullscreen");
const displayShell = requiredElement<HTMLElement>("#display-shell");
const canvas = requiredElement<HTMLCanvasElement>("#display");
const disk = requiredElement<HTMLInputElement>("#disk");
const fileInputs = [
  [disk, requiredElement<HTMLElement>("#disk-state")]
] as const;
let activeSession: Pc110Session | undefined;
let starting = false;
let launchAttempt = 0;

function formatFile(input: HTMLInputElement): string {
  const file = input.files?.[0];
  return file ? `${file.name} (${Math.ceil(file.size / 1024)} KiB)` : "Default: Personaware-realbios.img";
}

function updateControls(): void {
  for (const [input, state] of fileInputs) state.textContent = formatFile(input);
  const ready = true;
  start.disabled = starting || Boolean(activeSession) || !ready;
  restart.disabled = false;
  pause.disabled = true;
}

function report(message: string): void {
  const nextMessage = message || "Starting PC110…";
  const history = (status.dataset.history ?? "").split("\n").filter(Boolean);
  history.push(nextMessage);
  status.dataset.history = history.slice(-16).join("\n");
  status.textContent = nextMessage;
}

function describeStartupError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return String(error ?? "PC110 startup failed.");
  }
  const candidate = error as Record<string, unknown>;
  const details = {
    name: candidate.name,
    message: candidate.message,
    errno: candidate.errno,
    code: candidate.code,
    stack: candidate.stack
  };
  return JSON.stringify(details, null, 2);
}

async function readAsset(input: HTMLInputElement, role: string): Promise<LocalAsset> {
  const file = input.files?.[0];
  if (!file) {
    throw new Error(`Select a ${role} file.`);
  }
  return { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
}

async function fetchRuntimeFile(path: string): Promise<Uint8Array> {
  const response = await fetch(new URL(path, artifactRoot));
  if (!response.ok) {
    throw new Error(`Required QEMU runtime file is unavailable: ${path}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchDefaultFirmware(path: string, role: string): Promise<LocalAsset> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Default PC110 ${role} is unavailable: ${path}`);
  return { name: path.split("/").at(-1) ?? role, bytes: new Uint8Array(await response.arrayBuffer()) };
}

async function fetchLocalVerificationAsset(path: string, role: string): Promise<LocalAsset> {
  const response = await fetch(new URL(path, localMediaRoot));
  if (!response.ok) {
    throw new Error(`Local verification ${role} is unavailable: ${path}`);
  }
  return { name: path.split("/").at(-1) ?? role, bytes: new Uint8Array(await response.arrayBuffer()) };
}

async function loadModuleFactory(): Promise<EmscriptenQemuFactory> {
  // The Emscripten output is a runtime-selected public asset, not an npm
  // dependency. Keep its import outside Next's static module graph.
  const importRuntime = new Function("url", "return import(url);") as (url: string) => Promise<unknown>;
  const artifact = await importRuntime(new URL("qemu-system-i386.js", artifactRoot).href) as { default?: unknown };
  if (typeof artifact.default !== "function") {
    throw new Error("The QEMU artifact did not export an Emscripten module factory.");
  }
  return artifact.default as EmscriptenQemuFactory;
}

async function startPc110(): Promise<void> {
  if (starting || activeSession) return;
  const attempt = ++launchAttempt;
  starting = true;
  updateControls();
  report("Loading PC110 runtime…");
  try {
    const moduleFactory = await loadModuleFactory();
    report("PC110 runtime module loaded.");
    const vgaBios = await fetchRuntimeFile("pc-bios/vgabios-stdvga.bin");
    report("PC110 VGA BIOS loaded.");
    const launchFiles = await Promise.all([
      fetchDefaultFirmware("/pc110/firmware/pc110_bios.bin", "BIOS"),
      fetchDefaultFirmware("/pc110/firmware/pc110_fontrom.bin", "font ROM"),
      disk.files?.[0]
        ? readAsset(disk, "disk image")
        : fetchDefaultFirmware("/pc110/disks/Personaware-realbios.img", "disk image")
    ]);
    report("PC110 firmware and disk image loaded.");
    let session: Pc110Session | undefined;
    const restoreAfterRuntimeFailure = (message: string): void => {
      report(message);
      activeSession = undefined;
      starting = false;
      updateControls();
      void session?.dispose().catch(error => report(describeStartupError(error)));
    };
    const bridge = createEmscriptenQemuBridge(
      moduleFactory,
      path => new URL(path, artifactRoot).href,
      report,
      { "/qemu-pc-bios/vgabios-stdvga.bin": vgaBios },
      restoreAfterRuntimeFailure
    );
    session = new Pc110Session({ moduleFactory: bridge }, { displayTarget: canvas, onStateChange: state => report(`PC110: ${state}`) });
    report("Starting PC110 Emscripten module…");
    const easySetup = {
      name: "easysetup.bin",
      bytes: extractPc110EasySetup(launchFiles[0].bytes)
    };
    report("PC110 Easy-Setup payload unpacked in browser memory.");
    let timeoutId: number | undefined;
    try {
      await Promise.race([
        session.start({ bios: launchFiles[0], fontRom: launchFiles[1], disk: launchFiles[2], easySetup }),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error("PC110 startup timed out after 45 seconds. Check deployment headers and runtime files, then reset and try again.")), 45_000);
        })
      ]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
    if (attempt !== launchAttempt) {
      await session.dispose();
      return;
    }
    activeSession = session;
    starting = false;
    updateControls();
    canvas.focus();
  } catch (error) {
    if (attempt !== launchAttempt) return;
    report(describeStartupError(error));
    starting = false;
    updateControls();
  }
}

for (const [input] of fileInputs) input.addEventListener("change", updateControls);
start.addEventListener("click", () => { void startPc110(); });
restart.addEventListener("click", () => {
  launchAttempt += 1;
  const session = activeSession;
  activeSession = undefined;
  starting = false;
  report("PC110 player reset. Start again with the default disk or choose an override.");
  void session?.dispose().finally(updateControls);
});
fullscreen.addEventListener("click", () => {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else if (displayShell.requestFullscreen) {
    void displayShell.requestFullscreen();
  } else {
    report("Full screen is not available in this browser.");
  }
});
document.addEventListener("fullscreenchange", () => {
  fullscreen.textContent = document.fullscreenElement ? "⛶" : "⛶";
  fullscreen.title = document.fullscreenElement ? "Exit full screen" : "Enter full screen";
  fullscreen.setAttribute("aria-label", fullscreen.title);
});
canvas.addEventListener("click", () => {
  canvas.focus();
  try {
    canvas.requestPointerLock?.();
  } catch {
    report("Pointer capture is unavailable in this browser.");
  }
});
document.addEventListener("keydown", event => {
  if (event.code === "ShiftRight" && document.pointerLockElement === canvas) {
    document.exitPointerLock();
    canvas.blur();
    report("Keyboard and pointer capture released.");
  }
});
report("Default PC110 firmware and Personaware-realbios.img are ready. Select a disk image to override it.");
updateControls();
