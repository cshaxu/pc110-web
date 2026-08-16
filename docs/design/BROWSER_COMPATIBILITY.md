# Browser Compatibility

## Required Platform Capability

PC110 Web runs QEMU's system emulator as a `wasm64` Emscripten module. It
requires the WebAssembly Memory64 feature; ordinary WebAssembly support is not
enough.

The player tests Memory64 before downloading the QEMU module. An unsupported
browser receives a clear startup message instead of a failed module import.

## Supported Baseline

- Chrome and Microsoft Edge 133 or later.
- Firefox 134 or later.

These are feature baselines, not a substitute for release-browser regression
tests. The deployment also requires cross-origin isolation for the threaded
Emscripten module.

## Unsupported Platforms

Safari and Safari on iOS do not currently implement WebAssembly Memory64.
There is therefore no supported Safari minimum version, including Safari 26.
The project must not offer a wasm32 fallback: QEMU's system emulator requires a
64-bit host address model, and the attempted wasm32 route failed in real PC110
boot after its first display frame.

## Reconsideration Gate

Safari support may be proposed only after a released Safari version implements
Memory64 and the full PC110 browser-start, display, input, reset, and
long-running stability suite passes on that version. A 32-bit-host QEMU port is
outside current project scope and needs a separately approved design proposal.