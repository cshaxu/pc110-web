# M3 T2 S1 P1: Clean Windows WASM Build Validation

**State:** Closed  
**Owner:** Web technical lead  
**Original request:** Complete the full local build task for the independent
PC110 Web project.

## Objective

Prove that the independent `emulation/` product can build a PC110-enabled
QEMU WebAssembly artifact on native Windows through Git Bash, then serve and
boot that artifact in a browser with locally held media.

## Scope

- Build a fresh Emscripten wasm64 dependency sysroot in an ignored cache.
- Configure QEMU 11.0.2 with the locked `cshaxu/pc110-qemu` revision and
  replayed Web patch series.
- Build and package `qemu-system-i386.js`, `qemu-system-i386.wasm`, standard
  VGA BIOS, configuration record, and checksum manifest.
- Serve the independent artifact root and verify browser-local BIOS, font ROM,
  disk, display, and PC110 POST boot handoff.

## Non-goals

- Do not commit, distribute, or deploy firmware, ROMs, disk images, Easy-Setup
  data, caches, or generated WASM artifacts.
- Do not modify QEMU or PC110-QEMU source.
- Do not claim complete Personaware desktop interaction, Easy-Setup workflow,
  or audible-output acceptance; those remain M1 T5 acceptance debt.

## Boundaries and dependencies

The task owns `emulation/scripts/**`, ignored local outputs, and this record.
It pins PC110-QEMU through `pc110-qemu.lock.json`, uses QEMU 11.0.2, Git Bash,
Windows-native UCRT GCC for build-machine generators, and Emscripten 6.0.6
for wasm64 target code. Local media stays outside Git and is read only by the
browser test.

## Implementation decisions

- Keep Git Bash core utilities ahead of MSYS `usr/bin`; MSYS `expr` parses
  QEMU's `--cc=emcc` option as `0` on this host. Expose only UCRT's GCC to the
  QEMU configuration environment.
- Build the PCRE2 8-bit static library directly. Its optional POSIX wrapper
  races the static libtool descriptor in this Git Bash/MSYS combination, while
  QEMU's GLib dependency requires only the 8-bit archive.
- Exclude non-build CI symlinks from Pixman extraction and disable unneeded
  GLib sysprof/introspection features. A Windows-only failure to create GLib
  GDB auto-load script paths is tolerated only after required static library,
  header, and pkg-config files are verified.
- Treat `/artifacts/` as the public artifact root consistently in the build
  runner, UI contract, and local server. The server may map an alternate
  ignored artifact root for clean-room validation.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Fresh target dependency sysroot | Ignored clean cache contains static zlib, libffi, Pixman, PCRE2, resolver stub, and GLib 2.84 with `manifest/sysroot-SHA256SUMS`. |
| Locked PC110 source configuration | Fresh QEMU configuration created `config.status` and `build.ninja`; it selected wasm64, `i386-softmmu`, TCG interpreter, and local keycodemapdb. |
| PC110 source compiled | Clean Ninja run completed `1617/1617`; its log includes `target_i386_pc110post.c.o`. |
| Packaged runtime integrity | Artifact manifest verifies `qemu-system-i386.js`, `qemu-system-i386.wasm`, `config-host.mak`, and `pc-bios/vgabios-stdvga.bin` with `sha256sum -c`. |
| Contract regression checks | TypeScript compilation passed; `pc110-session-contract=ok` and `emscripten-qemu-recovery=ok`. |
| Browser boot | Local server returned the fresh JS and WASM. Browser loaded locally selected BIOS, font ROM, and disk; it received 640×480, 640×350, and 720×400 display surfaces and reached `[pc110post] INT19` with a valid `55AA` disk boot sector. |

## Risks and follow-up

Emscripten reports unsupported `madvise` and `mprotect` syscalls during boot;
the runtime still produced display frames and a successful INT19 handoff. The
next product task may design the frontend/application and emulator-adapter
split, but must preserve this artifact-root and local-media boundary.

## Closure audit

The requested complete local build is now proven through fresh dependency
construction, fresh QEMU configuration, full PC110-enabled WASM compilation,
checksum verification, contract tests, and a browser boot. No generated output
or private media is staged for commit.
