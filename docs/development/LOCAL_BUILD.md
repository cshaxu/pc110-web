# PC110-QEMU Web

This repository contains the PC110 browser-emulation runtime. `src/emulator/`
owns the browser bridge, session, and diagnostic harness; `qemu/patches/` and
`scripts/qemu-build/` own the replayable local QEMU build inputs. Generated
QEMU source, SDKs, build output, and test media remain untracked.

- Machine simulation remains owned by the fixed QEMU baseline and existing PC110 devices and patches.
- Web-specific QEMU changes belong in `qemu/patches/` as a replayable patch series. Do not commit a generated full QEMU source tree.
- Product page and deployment code belongs in `src/app/`; browser runtime code belongs in `src/emulator/`.
- The PC110 simulator core is consumed through the pinned external dependency described in [PC110-QEMU dependency](../etc/PC110_QEMU_DEPENDENCY.md).

For Web development and tests, use the Git Bash-managed Node.js 22 and npm installation. Emscripten's bundled Node runtime is reserved for Emscripten's own build tooling; it is not the project npm runtime.

## Quick Start

This guide starts the browser application after a collaborator has obtained or
built the runtime artifacts (`public/emulator/qemu-system-i386.js` and
`public/emulator/qemu-system-i386.wasm`).

1. In Git Bash, enter the repository root and run the local server:

   ```sh
   npm run serve
   ```

   This is the one command needed to serve an existing Web build. It listens
   only on `http://127.0.0.1:5173` and prints that address on success.

2. Open `http://127.0.0.1:5173/` in a modern desktop browser. Use the three
   file buttons to select your entitled, local files; the files remain in the
   browser process and are not uploaded by this server.

   | Page field | Example local filename | Notes |
   | --- | --- | --- |
   | PC110 BIOS | `pc110_bios.bin` | The 256 KiB PC110 BIOS dump. |
   | PC110 font ROM | `MSM538032E@SOP44.BIN` | The 1 MiB Japanese font ROM dump. |
   | Personaware disk image | `Personaware-realbios.img` | The local real-BIOS disk variant with EMM386 disabled. |

3. Select **Start PC110**. A successful real-BIOS launch progresses through a
   720 × 400 POST/DOS surface and then changes to the 640 × 480 PersonaWare
   graphical surface. The canvas receives keyboard input and mouse or pen-like
   pointer input after it has focus.

### Local Media Preparation

`Personaware-realbios.img` is intentionally a local-only derivative of a
user-supplied `Personaware.img`. The real PC110 BIOS path requires EMM386,
`DOS=HIGH,UMB`, and `DEVICEHIGH` directives to be disabled in `CONFIG.SYS`;
the upstream project documents why this is required in
[`../disks/README.md`](../disks/README.md#real-bios-boot-remove-emm386).

Create and retain that variant outside the repository. Do not commit the
original disk, the variant, BIOS, font ROM, extracted Easy-Setup program, or
any other private media. The local server can optionally expose a private media
directory for development-only verification through
`PC110_WEB_LOCAL_MEDIA_ROOT`; ordinary browser use should select files through
the page controls.

## Build the QEMU Web Runtime

From the repository root, run one interactive command:

```sh
npm run setup-build
```

The command shows every material action and requires `yes` or `y` before host-package installation, Emscripten download, or the QEMU build. Use `npm run setup-build -- --prepare-only` to stop before compilation.

| Host | Entry terminal | Host-package route | Validation state |
| --- | --- | --- | --- |
| Windows 11 | Git Bash | MSYS2 `pacman` (prompted) | Verified locally |
| Linux | Native shell | APT (prompted) | Bootstrap implemented; native QEMU regression pending |
| macOS | Terminal | Homebrew (prompted) | Bootstrap implemented; native QEMU regression pending |

The Windows route needs Git Bash and uses MSYS2 only for native host utilities; it does not use WSL, Docker, or remote execution. Linux and macOS setup is implemented, but compilation deliberately stops until a native artifact has been recorded. This avoids claiming untested QEMU builds work.

### Troubleshooting

- **The Start button does not enable:** select all three files; their names need
  not match the examples, but their contents must be the matching PC110 media.
- **The page says a QEMU artifact is unavailable:** build or obtain the ignored
  Web artifacts before running `npm run serve`.
- **The image remains at 720 × 400:** use the prepared
  `Personaware-realbios.img`, not the original EMM386-enabled disk.
- **Keyboard or pointer input appears inactive:** click the canvas first. The
  server sends the cross-origin isolation headers required by the threaded
  Emscripten runtime, so use its `127.0.0.1` URL rather than opening
  `index.html` directly from disk.

See [`../design/`](../design/) for the detailed architecture, layout, and roadmap.
