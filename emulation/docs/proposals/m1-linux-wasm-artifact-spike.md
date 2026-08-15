# M1 Linux/WSL WASM Artifact Spike

## Context

M1 T1 S1 P1 established that QEMU 11.0.2 has an Emscripten host path. Its `wasm64` host requires `--enable-tcg-interpreter`. A local Windows probe reached that path but QEMU rejected the Git-for-Windows/MSYS host (`MSYS_NT-*`), so no browser artifact was produced. This candidate continues the accepted M1 outcome in a supported POSIX environment without changing QEMU core to accommodate MSYS.

## Proposal

In Linux or WSL, build the fixed QEMU 11.0.2 revision with Emscripten 6.0.6 and the recorded minimal configuration. Produce a no-asset `i386-softmmu` browser artifact, inspect its generated files and resource settings, and run a browser smoke that records startup behavior. Do not apply PC110 files or patches until this baseline artifact is verified.

## Goals and acceptance

1. Reproduce configuration and link completion in Linux or WSL with the exact source revision and toolchain version.
2. Record artifact filenames, compressed and uncompressed sizes, initial memory settings, and startup-failure behavior with no proprietary assets.
3. Run one browser load smoke and preserve a concise, reproducible verification record.
4. Decide whether the next Task should install the PC110 devices and replay patches, or whether a resource/runtime limitation requires a route-change proposal.

## Non-goals

PC110 device installation, patch replay, BIOS/ROM/disk distribution, UI, bridge API, audio, persistence, Workers, and public hosting.

## Risks and stop conditions

If QEMU 11.0.2 cannot link or load in Linux/WSL without a material QEMU-core redesign, stop and create a route-change proposal. If the artifact needs cross-origin isolation, a Worker, or larger memory, record that fact but do not add it in this task.
