# M1 Windows Local WASM Environment

## Context

QEMU officially supports native Windows builds through the MinGW-w64 toolchain. The previous Git-for-Windows/MSYS experiment did not establish the viability of a Windows Emscripten build: Git-for-Windows is not MSYS2 UCRT64, and QEMU 11.0.2 needs an explicit `-DEMSCRIPTEN` compatibility flag with the current Emscripten SDK.

## Proposal

Install or verify MSYS2 UCRT64 and Emscripten 6.0.6 on the local Windows workstation. Run a no-source-change QEMU 11.0.2 `i386-softmmu` configure and build experiment using the Web-owned build command. Capture the exact package/tool versions, host macro probe, generated outputs, and failure or success evidence. Keep downloads and build products ignored under `web/`.

## Goals and Acceptance

1. Prove the local host is MSYS2 UCRT64 rather than Git-for-Windows/MSYS and record the tool versions.
2. Confirm Emscripten exposes `__EMSCRIPTEN__` and that `-DEMSCRIPTEN` admits QEMU's Emscripten host path.
3. Configure and link the no-asset QEMU 11.0.2 `i386-softmmu` target, or capture the first reproducible blocking failure.
4. Record a go, defer, or route-change decision before applying PC110 devices or patches.

## Non-goals

Repository-root CI, QEMU source patches, PC110 device installation, ROMs, disks, browser UI, bridge API, public hosting, and operating-system-wide permanent environment changes beyond the explicitly approved tool installation.

## Risks and Stop Conditions

MSYS2 and Emscripten require multi-gigabyte downloads and may need elevated installation rights. If their setup cannot coexist reliably, or QEMU still requires a material source redesign after the explicit compatibility flag, stop and record the evidence rather than modifying QEMU core.
