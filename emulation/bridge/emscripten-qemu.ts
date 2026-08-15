import type { QemuModuleFactory, QemuModuleHandle, QemuModuleRequest } from "./pc110-session.js";

export interface EmscriptenFileSystem {
  mkdirTree(path: string): void;
  writeFile(path: string, bytes: Uint8Array): void;
}

export interface EmscriptenQemuModule extends QemuModuleHandle {
  readonly FS: EmscriptenFileSystem;
  readonly HEAPU8: Uint8Array;
}

export type EmscriptenWebPresenter = (pixels: number | bigint, width: number, height: number, stride: number) => void;

export interface EmscriptenQemuOptions {
  arguments: string[];
  canvas?: HTMLCanvasElement;
  locateFile: (path: string) => string;
  preRun: Array<(module: EmscriptenQemuModule) => void>;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
  setStatus?: (message: string) => void;
}

export type EmscriptenQemuFactory = (options: EmscriptenQemuOptions) => Promise<EmscriptenQemuModule>;

function parentDirectory(path: string): string {
  const separator = path.lastIndexOf("/");
  return separator > 0 ? path.slice(0, separator) : "/";
}

function createCanvasPresenter(
  canvas: HTMLCanvasElement,
  getModule: () => EmscriptenQemuModule | undefined,
  onFirstFrame?: () => void
): EmscriptenWebPresenter {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("The PC110 display canvas does not provide a 2D context.");
  }
  let image: ImageData | undefined;
  let hasPresented = false;
  return (pixels, width, height, stride) => {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      image = undefined;
    }
    if (!image) {
      image = context.createImageData(width, height);
    }
    const target = image;
    const module = getModule();
    if (!module) {
      return;
    }
    const offset = Number(pixels);
    const source = new Uint8Array(module.HEAPU8.buffer, offset, stride * height);
    for (let y = 0; y < height; y += 1) {
      const sourceRow = y * stride;
      const targetRow = y * width * 4;
      for (let x = 0; x < width; x += 1) {
        const sourcePixel = sourceRow + x * 4;
        const targetPixel = targetRow + x * 4;
        target.data[targetPixel] = source[sourcePixel + 2] ?? 0;
        target.data[targetPixel + 1] = source[sourcePixel + 1] ?? 0;
        target.data[targetPixel + 2] = source[sourcePixel] ?? 0;
        target.data[targetPixel + 3] = 255;
      }
    }
    context.putImageData(target, 0, 0);
    if (!hasPresented) {
      hasPresented = true;
      onFirstFrame?.();
    }
  };
}

export function createEmscriptenQemuBridge(
  moduleFactory: EmscriptenQemuFactory,
  locateFile: (path: string) => string,
  report?: (message: string) => void,
  runtimeFiles: Readonly<Record<string, Uint8Array>> = {},
  onRuntimeFailure?: (message: string) => void
): QemuModuleFactory {
  return async (request: QemuModuleRequest): Promise<EmscriptenQemuModule> => {
    let runtimeModule: EmscriptenQemuModule | undefined;
    const webGlobal = globalThis as typeof globalThis & {
      __pc110WebPresent?: EmscriptenWebPresenter;
    };
    let hasRoutedFrame = false;
    let runtimeFailureReported = false;
    const reportRuntimeFailure = (message: string): void => {
      if (runtimeFailureReported) {
        return;
      }
      runtimeFailureReported = true;
      onRuntimeFailure?.(message);
    };
    const routeRuntimeError = (message: string): void => {
      const frame = /^pc110-web-frame:(.+):(\d+):(\d+):(\d+)$/.exec(message);
      if (frame) {
        if (!webGlobal.__pc110WebPresent) {
          report?.("PC110 web display frame metadata arrived before the canvas presenter was ready.");
          return;
        }
        webGlobal.__pc110WebPresent(BigInt(frame[1]!), Number(frame[2]), Number(frame[3]), Number(frame[4]));
        if (!hasRoutedFrame) {
          hasRoutedFrame = true;
          report?.("PC110 web display frame metadata received.");
        }
        return;
      }
      report?.(message);
      // The checked-in runtime predates the optional onAbort/onExit Module
      // callbacks. QEMU reports command-line validation errors through stderr
      // before it exits, so use that stable channel to restore the UI without
      // passing an unsupported Module property to an older artifact.
      if (/^qemu-system-i386:|^qemu:/.test(message)) {
        reportRuntimeFailure("PC110 startup failed. Correct the selected files and try Start again.");
      }
    };
    const options: EmscriptenQemuOptions = {
      arguments: [...request.arguments],
      locateFile: path => {
        const resolved = locateFile(path);
        report?.(`PC110 runtime resource: ${path} -> ${resolved}`);
        return resolved;
      },
      preRun: [module => {
        try {
          runtimeModule = module;
          const files = { ...runtimeFiles, ...request.files };
          const directories = new Set(["/tmp", "/var/tmp", ...Object.keys(files).map(parentDirectory)]);
          for (const directory of directories) {
            module.FS.mkdirTree(directory);
          }
          for (const [path, bytes] of Object.entries(files)) {
            module.FS.writeFile(path, bytes);
          }
        } catch (error) {
          report?.(`PC110 virtual filesystem setup failed: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }],
      print: report,
      printErr: routeRuntimeError,
      setStatus: report
    };
    if (request.displayTarget) {
      webGlobal.__pc110WebPresent = createCanvasPresenter(
        request.displayTarget,
        () => runtimeModule,
        () => report?.("PC110 web display received its first frame.")
      );
    }
    return moduleFactory(options);
  };
}
