# M2 T2 S1 P1: Display-Capable Emscripten Runtime

## Task Brief

**State:** Complete — the browser-local software display, keyboard transport, POST, Easy-Setup branch, and disk boot have all been exercised against the real PC110 firmware and local media.

**Goal:** Establish a display-capable, browser-local Emscripten configuration for the verified PC110-adapted QEMU artifact and connect its runtime contract to the existing Web session boundary.

## Requirements Ledger

| Requirement | State | Acceptance evidence |
| --- | --- | --- |
| Identify a supported QEMU display backend for this Emscripten build | Complete | The replayable `-display web` backend produces a QEMU software surface that the page presents through the bridge. |
| Preserve PC110 WASM source replay | Complete | The PC110 devices and POST completer build in the Emscripten artifact; browser log records the real-BIOS INT19 disk handoff. |
| Bind display target through the Web bridge | Complete | The module factory receives the page-owned Canvas; an actual browser received the first 640 × 480 QEMU surface. |
| Deliver browser keyboard input to the QEMU worker | Complete | A browser `KeyA` down/up event was registered and dispatched by the QEMU worker after its main loop began polling Emscripten's event queue. |
| Deliver browser pointer input to the QEMU worker | Complete | The page canvas maps pointer motion and left/middle/right buttons to QEMU's standard absolute or relative input queue; a browser click reached the QEMU worker as motion, down, and up events at the expected guest coordinates. |
| Refresh the standard-VGA guest surface | Complete | The Web display listener now invokes `graphic_hw_update()` from QEMU's standard refresh hook; a browser run changed from the initialization surface to 640 × 350 and 720 × 400 guest VGA surfaces. |
| Exercise the F1 Easy-Setup branch | Complete | F1 sent during the rendered POST window prevented the normal INT19 disk handoff and changed the guest surface to 640 × 480, the Easy-Setup display mode. |
| Keep no-asset boundary | Complete | No BIOS, font-ROM, disk, or derivative enters a tracked path. |

## Current Evidence

- The local development server exposes an opt-in, read-only `/_pc110-local-media/` route. Its root defaults to the private local media bundle and can be overridden with `PC110_WEB_LOCAL_MEDIA_ROOT`; no private media is copied into the repository.
- `?local-verification` loads the required BIOS, Japanese font ROM, and PersonaWare disk through that route. The served byte counts were 262,144, 1,048,576, and 4,194,304 respectively.
- A connected external browser reached the Emscripten QEMU module after automatic media loading. This eliminates the earlier in-app file-chooser limitation as the source of the failure.
- The earlier SDL/EGL experiments failed at the worker-context boundary (`GLctx` was undefined or a transferred canvas rejected `getContext()`). The accepted implementation avoids SDL and EGL entirely.
- `0005-emscripten-web-display.patch` adds QEMU's `-display web` software-surface backend. It sends framebuffer metadata from the QEMU worker through the supported `printErr` route; the page bridge copies BGRX pixels from the exported Emscripten heap into its own 2D canvas.
- A clean browser run registered a 640 × 480 QEMU surface, delivered the first framebuffer metadata, and reached `[pc110post] INT19: booted /pc110-input/Personaware-disk.img LBA0 -> 0000:7C00 (sig 55AA) DL=80`.
- The initial backend omitted QEMU's standard display-refresh callback. That meant the listener could receive its initialization surface but never ask the VGA device to repaint. The fix implements `.dpy_refresh` with `graphic_hw_update(dcl->con)`, matching QEMU's ordinary graphical display backends.
- After the refresh fix, a clean browser run changed the QEMU surface from its 640 × 480 initialization surface to the PC110 POST's 640 × 350 surface and then the standard 720 × 400 VGA surface before the real-BIOS INT19 disk handoff. Frame metadata reached the page bridge on the same run.
- Browser events initially registered successfully but remained queued because the continuously running QEMU worker did not service Emscripten's system proxy queue. `0006-emscripten-pump-event-proxies.patch` pumps that queue from the Emscripten-only QEMU main-loop path. A subsequent browser `KeyA` generated both QEMU-worker down and up dispatches.
- `0005-emscripten-web-display.patch` additionally maps canvas mouse movement and left/middle/right clicks into QEMU input. It uses absolute coordinates when the selected QEMU input device supports them and relative deltas otherwise. A temporary, removed QEMU-side probe recorded browser motion plus left-button down/up at the translated guest coordinate (231,249).
- A timed browser F1 test, issued after display initialization and before the normal boot decision, suppressed the normally observed INT19 disk-handoff log for the following 16 seconds. This is the expected PC110POSTUI Easy-Setup branch and proves a browser key changes the emulated machine's boot behavior.
- The Web launch path derives the 232,185-byte Easy-Setup program from the selected BIOS in browser memory and exposes it only through the fixed virtual path expected by the original F1 branch. It neither writes the derivative to disk nor includes it in the repository. A fresh browser F1 test entered that branch (no INT19 handoff) and changed to its 640 × 480 display surface.
- The runtime uses a fixed 512 MiB initial WebAssembly memory allocation. The tested private media remain accessible only through the opt-in local development route.
- The browser launch plan intentionally does not apply the native script's real-time `-icount shift=5` pacing. Removing that throttle allowed the local real-BIOS profile to reach the PersonaWare 640 × 480 graphical surface during browser acceptance.

## Follow-On Work

This Part closes the display-capability acceptance gap. Later Parts may add UI controls, audio, persistence, and broader guest-application test coverage; none is required to establish that real PC110 graphics and keyboard-controlled firmware paths work in the browser.

## Scope

The Part owns Web build adapters, Web-owned QEMU patches if independently justified, bridge runtime adaptation, and isolated browser-runtime tests. It excludes a finished page UI, audio acceptance, persistence, and publication.

## Risk

The custom backend intentionally has no GL scanout support. It is appropriate for the PC110 standard-VGA software surface. The remaining risk is compatibility breadth for future display modes, not the verified POST, Easy-Setup, and PersonaWare boot paths.
