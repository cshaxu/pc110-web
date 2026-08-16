# M3 T5 S2 P1: wasm32 Safari 26 Compatibility Path

**State:** Closed — rejected at runtime
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
- Safari 26.0 selects the separately deployed wasm32 runtime; other browsers
  retain wasm64 as the default.

## Acceptance Evidence

- The Safari target flag has a focused script-level contract test.
- wasm32 performs an independent clean configuration and artifact build.
- wasm32 module import and browser boot are recorded independently from wasm64.

## Progress Record

The Windows-native Git Bash route completed a distinct wasm32 configuration
and full QEMU build. The resulting browser artifacts were promoted to
`public/emulator/wasm32/`, including the matching VGA BIOS. The wasm32 output
is 29,599,731 bytes and is accompanied by `SHA256SUMS`.

The build discovered two upstream portability assumptions which are retained as
reviewable QEMU patches: QEMU's generic 32-bit-host guard now permits only the
explicit Emscripten route, and an unused GLib output-length pointer no longer
uses mismatched same-width typedefs. The dependency script also asks GLib to
perform its Clang-style `size_t` typedef probe for emcc, so future clean builds
produce an ABI-correct `gsize` declaration.

An immediate repeat through `incremental-qemu-wasm-gitbash.sh wasm32` produced
the complete candidate artifact while Ninja ran only the normal version-header
generator. It recompiled no QEMU C object and rebuilt no dependency.

The promoted public artifact passed `sha256sum -c SHA256SUMS`; Emscripten's
bundled Node 24.19.0 imported its ES module and confirmed the default module
factory export.

## Runtime Failure Record

The generated wasm32 module imported successfully and produced the first PC110
display frame, but both local and deployed browser sessions failed during the
real boot path with `RuntimeError: memory access out of bounds`. Rebuilding
with memory growth enabled did not change that result.

This is not a Safari-version detection failure. QEMU 11's system emulator
requires a 64-bit host address model, while wasm32 provides 32-bit pointers.
The temporary Emscripten exception to QEMU's upstream host-width guard allowed
the artifact to compile but did not make the system-emulator execution model
valid. The wasm32 artifact, selector route, and guard-bypass patches were
withdrawn. Production remains on the proven wasm64 runtime.

Any future Safari compatibility work must establish a Safari-capable wasm64
route or fund a separately reviewed 32-bit-host QEMU port; it must not restore
this bypass merely because the module imports or draws a first frame.