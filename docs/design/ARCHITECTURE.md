# Emulator Adapter Architecture

The Web product is built on a fixed QEMU baseline and the existing PC110 patch set. QEMU owns CPU, machine, device, clock, and guest state; `src/emulator/` owns browser-host behavior. The selected baseline is QEMU 11.0.2, whose source contains an Emscripten host path; its `wasm64` host requires the TCG interpreter. The build boundary has one interactive Node entry point (`npm run setup-build`), which detects Windows, Linux, or macOS and requests explicit approval before package installation, SDK download, and compilation.

```text
Product application (src/app/)
  -> versioned emulator runtime contract
     -> Web session controller
        -> versioned WASM bridge
           -> QEMU i386-softmmu + PC110 devices/patches
        <- framebuffer, audio/events, lifecycle/status
     -> local-media adapter
```

Boundaries and ownership:

| Boundary | Owner | Responsibility |
| --- | --- | --- |
| QEMU/PC110 | Locked upstream and `qemu/patches/` | Simulation, devices, and machine state |
| WASM bridge | `src/emulator/bridge/` | Controlled startup and stable input/framebuffer/state bridge |
| Web session | `src/emulator/session/` | Session lifecycle, errors, and scheduling |
| Standalone harness | `src/emulator/harness/` | Canvas diagnostic page, input focus, and status display |
| Product application | `src/app/` | Product UI, routing, deployment, and versioned runtime consumption |
| Runtime media | `public/emulator/` and `public/pc110/` | Published runtime bundle and intentionally served PC110 media |
| Persistence | Future `src/emulator/persistence/` | Versioned snapshots and IndexedDB, including quota and failure semantics |

The build adapter is an emulator-owned boundary. It must keep host-specific tool selection outside QEMU source and record an evidence-backed status per host. It must not depend on WSL, Docker, or a remote executor. MSYS2 is permitted only as an explicitly prompted source of Windows-native host utilities.

The first release favors a single thread, Canvas presentation, and manual user import. Workers, OffscreenCanvas, audio worklets, and preloaded assets enter a candidate task only when performance or user-experience evidence makes them necessary. See [the application and adapter boundary](APPLICATION_ADAPTER_BOUNDARY.md) for the frontend integration contract.
