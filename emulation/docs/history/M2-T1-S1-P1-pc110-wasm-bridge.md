# M2 T1 S1 P1: PC110 WASM Bridge

## Task Brief

**State:** Verified.

**Original request:** Implement browser-resident PC110-QEMU emulation that users can operate according to the original project's intent.

**Goal:** Produce a PC110-adapted QEMU wasm64 artifact and establish the Web-owned bridge contract required for a manually provisioned, interactive browser session.

## Boundaries

- Authoritative simulator inputs are QEMU 11.0.2 and the existing fork PC110 device/patch set; generated copies stay under ignored `web/.cache/`.
- All authored source, patches, documentation, and browser code stay under `web/`.
- Local BIOS, font-ROM, and disk files are selected at runtime and never committed, copied into tracked paths, or served as product assets.
- The Part owns only source preparation and artifact verification. The TypeScript session/UI is a following Part under this Task.

## Requirements Ledger

| Requirement | State | Acceptance evidence |
| --- | --- | --- |
| Replay PC110 source and patches against fixed QEMU | Complete | Fresh ignored source tree applies all six PC110 patches and all four Web Emscripten patches; each Web patch reverse-checks cleanly. |
| Build a PC110-adapted wasm64 artifact | Complete | `qemu-system-i386.js`, `.wasm`, and `SHA256SUMS` are recorded under ignored `web/.cache/pc110-wasm-artifact-m2/`. |
| Preserve no-asset boundary | Complete | Git status contains only authored `web/**` files; test files and generated artifacts remain ignored. |
| Establish bridge constraints | Deferred to M2 T1 S2 P1 | The versioned bridge interface and browser integration have their own active Part. |

## Risks

The original M1 artifact excludes PC110 sources; an artifact that imports successfully but lacks `pc110-chipset` is not sufficient. The default Emscripten configuration disables the display backend, so a successful PC110 artifact proves source/startup readiness but not yet interactive Canvas presentation.

## Verification Plan

1. Run the Web-owned source-preparation script against the ignored QEMU 11.0.2 checkout.
2. Verify the root PC110 patch series and each Web Emscripten patch apply or reverse-check cleanly.
3. Build `qemu-system-i386.js` and `.wasm` with the existing target sysroot.
4. Import the ES module with the local Emscripten Node runtime and verify that the artifact was produced from the PC110-adapted source record.
5. Do not claim browser display, keyboard, audio, or guest application success until a subsequent browser-session Part produces direct evidence.

## Execution Record

- `prepare-pc110-wasm-source-gitbash.sh` created an ignored QEMU 11.0.2 source copy, copied the fork PC110 device files and POST completer, added the two device sources to the build, and replayed the existing six PC110 patches and four Web Emscripten patches.
- QEMU 11.0.2 already has a legacy `EMSCRIPTEN` copy-file-range guard. `0003-emscripten-guard-posix-block-probes.patch` was corrected to extend that guard to `__EMSCRIPTEN__`, so it cleanly applies to the fixed baseline rather than assuming the old guard is absent.
- The Git-Bash adapter now prefers the installed Windows Python 3.13 when available. This avoids a UCRT Python 3.14 `bin/` virtual-environment layout that is incompatible with QEMU's Windows `Scripts/` adapter.
- The clean configured build completed 1,616 Ninja steps. `compile_commands.json` records compilation of `hw/misc/pc110-fontrom.c`, `hw/misc/pc110-chipset.c`, and `target/i386/pc110post.c` with Emscripten.
- The recorded artifact has `qemu-system-i386.js` SHA-256 `BC852E5B2A6C056AE4456DABC8629C81364164E79C5B29CA55F7899D988C5CE7` (413,006 bytes) and `qemu-system-i386.wasm` SHA-256 `9DA9B6AA87071619AFB9420670901E5FCA58D778409F25E82B61FE1139F1F3FB` (37,013,710 bytes). The local Emscripten Node runtime imported the JavaScript ES module and confirmed its default module factory.
