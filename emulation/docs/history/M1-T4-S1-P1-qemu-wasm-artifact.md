# M1 T4 S1 P1: QEMU WASM Artifact

## Task Brief

**State:** Closed.

**Goal:** Build the configured QEMU 11.0.2 `i386-softmmu` Emscripten artifact locally on Windows, record its generated JavaScript/WASM artifacts and resource characteristics, and perform a no-asset smoke without asserting PC110 behavior.

**Inputs:** The closed M1 T3 S2 P2 Web-local wasm64 sysroot, Git Bash adapter, locally prepared QEMU keycodemapdb subproject, replayable Emscripten staging patch, and UCRT MinGW-w64 host compiler for generator executables only.

**Non-goals:** PC110 device installation, root `qemu/` patch replay, ROM or disk archive access, browser product UI, input bridge, persistence, performance certification, and behavioral claims.

## Requirements Ledger

| Requirement | Owner | State | Acceptance evidence |
| --- | --- | --- | --- |
| Build only the configured `qemu-system-i386` target | Web technical lead | Closed | Clean Ninja build completed 1613/1613 steps. |
| Preserve Emscripten target isolation | Web technical lead | Closed | The generated build uses the Web-local wasm64 sysroot and Emscripten target compiler. |
| Record the artifact contract | Web technical lead | Closed | Artifact sizes and SHA-256 fingerprints are recorded below. |
| Run a no-asset smoke | Web technical lead | Closed | Emsdk Node imported the ES module and confirmed its default QEMU module factory. |
| Preserve scope and provenance | Web technical lead | Closed | Outputs remain ignored; only replayable files under `web/**` are committed. |

## Exit Decision

This Part closes only after a generated WASM/JavaScript artifact is present and its no-asset startup result is recorded. If the artifact cannot link without an additional QEMU-source behavior patch, record the exact linker evidence and admit a separate patch decision before making it.

## Execution Record

- `0002-emscripten-use-predefined-cacheflush-guard.patch` admits Emscripten's compiler-provided `__EMSCRIPTEN__` macro to select QEMU's existing cache-flush no-op branch.
- `0003-emscripten-guard-posix-block-probes.patch` returns `ENOTSUP` from the optional logical-block-size probe and prevents internal linkage for QEMU's fallback `copy_file_range` when Emscripten libc provides that symbol.
- `0004-emscripten-propagate-compile-define.patch` retains `-DEMSCRIPTEN` in QEMU's later-loaded Emscripten Meson machine file; otherwise that file replaces the generated cross-file compiler arguments.
- The clean build completed all 1613 Ninja steps. Generated artifacts are `qemu-system-i386.js` (430,667 bytes; SHA-256 `2CDFA37F878E783E393AACC4473D85E9B1D1F9BBFFC23525AE05321B0AB26D4D`) and `qemu-system-i386.wasm` (36,942,411 bytes; SHA-256 `D47F45E75B80E54A6158574B2CE253E9BA6DA996F2267790098676545344FA0A`).
- Emsdk Node 24.19.0 imported the generated ES module and verified that it exports the default QEMU module factory. This is a load-contract smoke only; it does not start QEMU and does not assert PC110 behavior.
- No PC110 device, ROM, disk, or personal asset was used.
