# M3 T5 S2 P1: wasm32 Safari 26 Compatibility Path

**State:** Active
**Owner:** Web technical lead
**Depends on:** M3 T5 S1 P1, M3 T5 S1 P2

## Objective

Add a fully isolated wasm32 build path and use Safari 26.0 as the explicit
browser compatibility floor for the generated Emscripten browser module.

## Compatibility Contract

- The browser module sets `MIN_SAFARI_VERSION=260000`.
- wasm32 is a distinct ABI with its own source, dependency sysroot, Meson/Ninja
  build directory, configuration record, and candidate artifact.
- wasm32 does not reuse wasm64 caches or claim compatibility below Safari 26.0.
- Runtime variant selection remains a later, explicit policy task; this Part
  proves build isolation and artifact viability only.

## Acceptance Evidence

- The Safari target flag has a focused script-level contract test.
- wasm32 performs an independent clean configuration and artifact build.
- wasm32 module import and browser boot are recorded independently from wasm64.
