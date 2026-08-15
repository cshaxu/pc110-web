import { createEmscriptenQemuBridge, type EmscriptenQemuFactory } from "../bridge/emscripten-qemu.js";
import { extractPc110EasySetup, Pc110Session, type LocalAsset } from "../session/pc110-session.js";

const artifactRoot = new URL("./artifacts/", window.location.href);
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
const restart = requiredElement<HTMLButtonElement>("#restart");
const fullscreen = requiredElement<HTMLButtonElement>("#fullscreen");
const displayShell = requiredElement<HTMLElement>("#display-shell");
const canvas = requiredElement<HTMLCanvasElement>("#display");
const bios = requiredElement<HTMLInputElement>("#bios");
const fontRom = requiredElement<HTMLInputElement>("#font-rom");
const disk = requiredElement<HTMLInputElement>("#disk");
const fileInputs = [
  [bios, requiredElement<HTMLElement>("#bios-state")],
  [fontRom, requiredElement<HTMLElement>("#font-rom-state")],
  [disk, requiredElement<HTMLElement>("#disk-state")]
] as const;
const localVerification = new URLSearchParams(window.location.search).has("local-verification");
let activeSession: Pc110Session | undefined;
let starting = false;

function formatFile(input: HTMLInputElement): string {
  const file = input.files?.[0];
  return file ? `${file.name} (${Math.ceil(file.size / 1024)} KiB)` : "No file selected";
}

function updateControls(): void {
  for (const [input, state] of fileInputs) state.textContent = formatFile(input);
  const ready = localVerification || fileInputs.every(([input]) => Boolean(input.files?.[0]));
  start.disabled = starting || Boolean(activeSession) || !ready;
  restart.disabled = starting || !activeSession;
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

async function fetchLocalVerificationAsset(path: string, role: string): Promise<LocalAsset> {
  const response = await fetch(new URL(path, localMediaRoot));
  if (!response.ok) {
    throw new Error(`Local verification ${role} is unavailable: ${path}`);
  }
  return { name: path.split("/").at(-1) ?? role, bytes: new Uint8Array(await response.arrayBuffer()) };
}

async function loadModuleFactory(): Promise<EmscriptenQemuFactory> {
  const artifact = await import(/* @vite-ignore */ new URL("qemu-system-i386.js", artifactRoot).href);
  if (typeof artifact.default !== "function") {
    throw new Error("The QEMU artifact did not export an Emscripten module factory.");
  }
  return artifact.default as EmscriptenQemuFactory;
}

async function startPc110(): Promise<void> {
  if (starting || activeSession) return;
  starting = true;
  updateControls();
  report("Loading PC110 runtime…");
  try {
    const moduleFactory = await loadModuleFactory();
    report("PC110 runtime module loaded.");
    const vgaBios = await fetchRuntimeFile("pc-bios/vgabios-stdvga.bin");
    report("PC110 VGA BIOS loaded.");
    const launchFiles = localVerification
      ? await Promise.all([
        fetchLocalVerificationAsset("Firmware/pc110_bios.bin", "BIOS"),
        fetchLocalVerificationAsset("Firmware/MSM538032E@SOP44.BIN", "font ROM"),
        fetchLocalVerificationAsset("Boot%20Media/Personaware-realbios.img", "real-BIOS disk image")
      ])
      : await Promise.all([readAsset(bios, "BIOS"), readAsset(fontRom, "font ROM"), readAsset(disk, "disk image")]);
    report("PC110 local media loaded.");
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
    await session.start({ bios: launchFiles[0], fontRom: launchFiles[1], disk: launchFiles[2], easySetup });
    activeSession = session;
    starting = false;
    updateControls();
    canvas.focus();
  } catch (error) {
    report(describeStartupError(error));
    starting = false;
    updateControls();
  }
}

for (const [input] of fileInputs) input.addEventListener("change", updateControls);
start.addEventListener("click", () => { void startPc110(); });
restart.addEventListener("click", () => {
  if (!activeSession) return;
  const session = activeSession;
  activeSession = undefined;
  void session.dispose().finally(() => { updateControls(); void startPc110(); });
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
  fullscreen.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
});
updateControls();
