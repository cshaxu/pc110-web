export const PC110_BRIDGE_VERSION = "1";

export type Pc110SessionState = "idle" | "preparing" | "running" | "failed" | "disposed";

export interface LocalAsset {
  readonly name: string;
  readonly bytes: Uint8Array;
}

export interface Pc110LaunchFiles {
  readonly bios: LocalAsset;
  readonly fontRom: LocalAsset;
  readonly disk: LocalAsset;
  readonly easySetup?: LocalAsset;
}

export interface Pc110LaunchPlan {
  readonly bridgeVersion: typeof PC110_BRIDGE_VERSION;
  readonly arguments: readonly string[];
  readonly files: Readonly<Record<string, Uint8Array>>;
}

export interface QemuModuleRequest {
  readonly bridgeVersion: typeof PC110_BRIDGE_VERSION;
  readonly arguments: readonly string[];
  readonly files: Readonly<Record<string, Uint8Array>>;
  readonly displayTarget: HTMLCanvasElement | null;
}

export interface QemuModuleHandle {
  stop?(): void | Promise<void>;
}

export type QemuModuleFactory = (request: QemuModuleRequest) => QemuModuleHandle | Promise<QemuModuleHandle>;

export interface Pc110SessionDependencies {
  readonly moduleFactory: QemuModuleFactory;
}

export interface Pc110SessionOptions {
  readonly displayTarget?: HTMLCanvasElement | null;
  readonly onStateChange?: (state: Pc110SessionState) => void;
}

const VFS_PATHS = {
  bios: "/pc110-input/pc110_bios.bin",
  fontRom: "/pc110-input/pc110_fontrom.bin",
  disk: "/pc110-input/Personaware-disk.img",
  easySetup: "/pc110-input/easysetup.bin"
} as const;

/**
 * Unpacks the PC110's LZW-compressed Easy-Setup program from its BIOS image.
 * The result exists only in the browser process and is never persisted.
 */
export function extractPc110EasySetup(bios: Uint8Array): Uint8Array {
  if (bios.length < 0x20000 || bios[0] !== 0x55 || bios[1] !== 0xaa || bios[3] !== 0xeb || bios[4] !== 0x45) {
    throw new Error("The selected BIOS does not contain a recognized PC110 Easy-Setup payload.");
  }
  const source = bios.subarray(0x02bf, 0x20000);
  const prefix = new Uint16Array(4096);
  const suffix = new Uint8Array(4096);
  const output: number[] = [];
  let bits = 9;
  let nextCode = 0x102;
  let growAt = 0x200;
  let old = -1;
  let first = 0;
  let bitPosition = 0;

  const readCode = (): number => {
    const bytePosition = Math.floor(bitPosition / 8);
    const bitOffset = bitPosition & 7;
    if (bytePosition + 3 > source.length) {
      return -1;
    }
    const value = source[bytePosition]! | (source[bytePosition + 1]! << 8) | (source[bytePosition + 2]! << 16);
    bitPosition += bits;
    return (value >>> bitOffset) & ((1 << bits) - 1);
  };

  const expand = (code: number): number[] => {
    const stack: number[] = [];
    while (code >= 0x100) {
      if (code >= nextCode || stack.length >= 4096) {
        throw new Error("The PC110 Easy-Setup LZW stream is invalid.");
      }
      stack.push(suffix[code]!);
      code = prefix[code]!;
    }
    stack.push(code & 0xff);
    return stack;
  };

  while (true) {
    const code = readCode();
    if (code < 0) {
      throw new Error("The PC110 Easy-Setup LZW stream ended unexpectedly.");
    }
    if (code === 0x101) {
      return new Uint8Array(output);
    }
    if (code === 0x100) {
      bits = 9;
      nextCode = 0x102;
      growAt = 0x200;
      old = -1;
      const literal = readCode();
      if (literal < 0 || literal >= 0x100) {
        throw new Error("The PC110 Easy-Setup LZW stream has an invalid clear code.");
      }
      output.push(literal);
      old = literal;
      first = literal;
      continue;
    }
    const special = code === nextCode;
    const stack = special ? expand(old) : expand(code);
    const currentFirst = special ? first : stack[stack.length - 1]!;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      output.push(stack[index]!);
    }
    if (special) {
      output.push(first);
    }
    if (old >= 0 && nextCode < 4096) {
      prefix[nextCode] = old;
      suffix[nextCode] = currentFirst;
      nextCode += 1;
      if (nextCode >= growAt && bits < 12) {
        bits += 1;
        growAt <<= 1;
      }
    }
    old = code;
    first = currentFirst;
  }
}

function requireNonEmptyAsset(role: string, asset: LocalAsset): void {
  if (!asset.name.trim()) {
    throw new Error(`${role} file name is required.`);
  }
  if (asset.bytes.byteLength === 0) {
    throw new Error(`${role} file must not be empty.`);
  }
}

export function buildPc110LaunchPlan(files: Pc110LaunchFiles): Pc110LaunchPlan {
  requireNonEmptyAsset("BIOS", files.bios);
  requireNonEmptyAsset("font ROM", files.fontRom);
  requireNonEmptyAsset("disk", files.disk);
  if (files.easySetup) {
    requireNonEmptyAsset("Easy-Setup", files.easySetup);
  }

  return {
    bridgeVersion: PC110_BRIDGE_VERSION,
    files: {
      [VFS_PATHS.bios]: files.bios.bytes,
      [VFS_PATHS.fontRom]: files.fontRom.bytes,
      [VFS_PATHS.disk]: files.disk.bytes,
      ...(files.easySetup ? { [VFS_PATHS.easySetup]: files.easySetup.bytes } : {})
    },
    arguments: [
      "-L", "/qemu-pc-bios",
      "-m", "4",
      "-cpu", "486",
      "-display", "web",
      "-nic", "none",
      "-bios", VFS_PATHS.bios,
      "-drive", `id=hd0,file=${VFS_PATHS.disk},format=raw,if=none`,
      "-device", "ide-hd,drive=hd0,bus=ide.0,unit=0,cyls=128,heads=2,secs=32",
      "-boot", "c",
      "-vga", "std",
      "-device", `pc110-chipset,biosfile=${VFS_PATHS.bios},vgac000=on`,
      "-device", `pc110-fontrom,romfile=${VFS_PATHS.fontRom}`
    ]
  };
}

export class Pc110Session {
  private handle: QemuModuleHandle | undefined;
  private state: Pc110SessionState = "idle";

  public constructor(
    private readonly dependencies: Pc110SessionDependencies,
    private readonly options: Pc110SessionOptions = {}
  ) {}

  public getState(): Pc110SessionState {
    return this.state;
  }

  public async start(files: Pc110LaunchFiles): Promise<void> {
    if (this.state !== "idle") {
      throw new Error(`Cannot start a PC110 session from ${this.state}.`);
    }

    const plan = buildPc110LaunchPlan(files);
    this.setState("preparing");
    try {
      this.handle = await this.dependencies.moduleFactory({
        bridgeVersion: plan.bridgeVersion,
        arguments: plan.arguments,
        files: plan.files,
        displayTarget: this.options.displayTarget ?? null
      });
      this.setState("running");
    } catch (error) {
      this.setState("failed");
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    if (this.state === "disposed") {
      return;
    }
    await this.handle?.stop?.();
    this.handle = undefined;
    this.setState("disposed");
  }

  private setState(nextState: Pc110SessionState): void {
    this.state = nextState;
    this.options.onStateChange?.(nextState);
  }
}
