# M2: Browser Bridge and PC110 Startup

## Context

M1 produced a no-asset QEMU 11.0.2 wasm64 artifact and recorded a local PC110 BIOS/POST display baseline. That artifact intentionally excludes the fork's PC110 devices and patch set, so it cannot satisfy the browser-product goal by itself.

## Proposed Outcome

Build a PC110-adapted QEMU wasm64 artifact from the fixed QEMU 11.0.2 source, then introduce a Web-owned, versioned bridge and a minimal browser session that accepts user-selected local BIOS, font-ROM, and disk files. The browser must present the emulator display, route focused keyboard input, report lifecycle failures, and preserve the no-preloaded-media boundary.

## Scope

1. Prepare an ignored PC110 QEMU source tree by replaying the existing fork device sources and patch series plus the Web Emscripten patches.
2. Build and smoke a PC110-adapted wasm64 QEMU artifact on the supported local Windows/Git-Bash route.
3. Define the bridge ABI for argument construction, imported local files, display, keyboard input, status, and teardown.
4. Create a TypeScript browser application with manual asset selection, Canvas display, focused keyboard routing, and explicit startup/error states.
5. Verify a local browser session with user-owned local test assets. No asset bytes, screenshots, or generated artifacts are committed.

## Non-goals

Public hosting, preloaded BIOS/ROM/disk files, licensing conclusions, persistence/snapshots, Workers, mobile controls, audio-worklet optimization, and modifications outside `web/` are excluded.

## Risks and Gates

- QEMU's stock browser artifact has no PC110 devices; replay must remain clean against QEMU 11.0.2.
- The current wasm configuration disables SDL/VNC, so a display-capable browser backend is a separate acceptance gate rather than an assumed capability.
- The WASM build may need a narrowly scoped Emscripten patch. Any such patch must be replayable, Web-owned, and independently justified.
- Local asset import is a test/runtime operation only. The application must not package or fetch the supplied archive contents.

## Admission

The user authorized implementation of the browser-resident PC110-QEMU product. M1 has recorded the native launch contract and a local-only display baseline; its remaining Personaware/Easy-Setup and audible-output checks remain tracked as acceptance debt for end-to-end verification.
