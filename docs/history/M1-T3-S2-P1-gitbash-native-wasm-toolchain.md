# M1 T3 S2 P1: Git Bash-native WASM Toolchain

## Task Brief

**State:** Closed.

**Original request:** Implement the queued Windows-native Git Bash route after the governance reset, while retaining the larger goal that PC110 runs with the fork's author-intended behavior.

**Goal:** Add Web-owned Git Bash adapter scripts that select the existing Windows Python and Emscripten SDK consistently, including the Windows virtual-environment path contract, without changing QEMU source.

**Non-goals:** Build the final artifact, inspect or use PC110 assets, alter QEMU/PC110 source, implement browser UI, or claim PC110 boot behavior. Those belong to later admitted Parts.

## Requirements Ledger

| Requirement | Owner | State | Acceptance evidence |
| --- | --- | --- | --- |
| Provide a Git Bash adapter for Windows Python and Emscripten | Web technical lead | Complete | Adapter selects Windows Python 3.13 and Emscripten 6.0.6; `emcc` compiles a WASM probe. |
| Reach QEMU's dependency-discovery boundary | Web technical lead | Complete | QEMU reaches Meson through the adapter; the target then reports its missing WASM GLib/pkg-config dependency. |
| Record fixed source and tool inputs | Web technical lead | Complete | Ignored record directory contains QEMU revision and Emscripten version files. |
| Preserve QEMU and asset boundaries | Web technical lead | Complete so far | All authored changes are under `web/**`; no local asset was read or copied. |

## Boundaries, Dependencies, and Risks

The adapter may write ignored files under `web/.cache/` only. It depends on Git Bash, an existing Windows Python installation reachable as `python`, and the ignored Emscripten 6.0.6 SDK. The fixed QEMU source remains ignored under `web/qemu-src/`. Git Bash/Windows path translation and QEMU's Python virtual environment are the primary risk. If the configuration cannot become repeatable without a QEMU source patch, record the exact blocker and stop for a separately admitted decision.

## Acceptance and Closure

This Part closes after the adapter and its QEMU dependency-discovery boundary are evidenced. `M1 T3 S2 P2` owns the dependency sysroot and complete configuration. M1 T4 S1 P1 owns compilation, artifact copies, and no-asset resource measurement. M1 T5 owns use of the user-provided local PC110 media archive and all author-intended behavior checks.

## Evidence to Date

The adapter creates a Git-Bash-local `python3` launcher for the existing Windows Python and forwards QEMU's POSIX-expected `pyvenv/bin/{python,python3,meson}` paths to the Windows virtual environment's `Scripts/*.exe` tools. With a fresh ignored build directory, QEMU's `configure` passes Emscripten host detection and reaches Meson. Meson successfully compiles Emscripten capability probes.

The first remaining blocker is `glib-2.0`: Meson reports that no host-machine `pkg-config` is available and therefore cannot discover the required GLib development dependency. A native Windows or MinGW GLib cannot be linked into the `wasm64-unknown-emscripten` target. That dependency work is explicitly transferred to `M1 T3 S2 P2`; no QEMU source patch is justified by this evidence.
