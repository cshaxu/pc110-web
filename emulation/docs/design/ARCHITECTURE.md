# Web Architecture

The Web product is built on a fixed QEMU baseline and the existing PC110 patch set. QEMU owns CPU, machine, device, clock, and guest state; `web/` owns browser-host behavior. The selected baseline is QEMU 11.0.2, whose source contains an Emscripten host path; its `wasm64` host requires the TCG interpreter. The build boundary has one interactive Node entry point (`npm run setup-build`), which detects Windows, Linux, or macOS and requests explicit approval before package installation, SDK download, and compilation.

```text
Browser UI
  -> Web session controller
     -> versioned WASM bridge
        -> QEMU i386-softmmu + PC110 devices/patches
     <- framebuffer, audio/events, lifecycle/status
  -> Asset and persistence adapters
```

Boundaries and ownership:

| Boundary | Owner | Responsibility |
| --- | --- | --- |
| QEMU/PC110 | Existing QEMU and `qemu/` patch set | Simulation, devices, and machine state |
| WASM bridge | `web/bridge/` and `web/qemu-patches/` | Controlled startup and stable input/framebuffer/state bridge |
| Web session | `web/src/session/` | Session lifecycle, errors, and scheduling |
| Web UI | `web/src/ui/` | Canvas, accessible UI, input focus, and status display |
| Browser assets | `web/src/assets/` | User import, validation, and memory lifecycle without bypassing distribution policy |
| Persistence | `web/src/persistence/` | Versioned snapshots and IndexedDB, including quota and failure semantics |

The build adapter is a Web-owned boundary. It must keep host-specific tool selection outside QEMU source and record an evidence-backed status per host. It must not depend on WSL, Docker, or a remote executor. MSYS2 is permitted only as an explicitly prompted source of Windows-native host utilities.

The first release favors a single thread, Canvas presentation, and manual user import. Workers, OffscreenCanvas, audio worklets, and preloaded assets enter a candidate task only when performance or user-experience evidence makes them necessary.
