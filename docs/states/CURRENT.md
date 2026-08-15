# Current Status

**Status: Verified — M3 T4 S1 P1 Next.js application host closed.** The independent Windows-native
clean build now produces and browser-boots a PC110-enabled WASM artifact while
preserving the controlled local-media boundary. The next admission
now uses the integrated layout. The next admission may extract the versioned
runtime contract.

Current technical baseline: fork `cshaxu/pc110-qemu`, HEAD `bae390e` (2026-07-21). The native build script pins QEMU 11.0.2. QEMU 11.0.2 source has an Emscripten/`wasm64` path requiring `--enable-tcg-interpreter`; current Emscripten compatibility requires the explicit legacy detection flag `-DEMSCRIPTEN` for this baseline. The admitted local direction is Git Bash as a Windows-native POSIX host, not MSYS2, WSL, Docker, or remote execution. Git Bash Node.js 22/npm is the project runtime for TypeScript, tests, and local serving; Emscripten's bundled Node is only for Emscripten build tooling. Generated source, SDK, and probe outputs remain ignored.

P1 closed the Git Bash adapter after proving the Python, Emscripten, and Windows virtual-environment path contract. P2 closed after provisioning the target-static wasm64 sysroot and producing a clean `config.status` and `build.ninja`. T4 then produced a wasm64 `qemu-system-i386` ES module and performed a no-asset Node import smoke. The configuration uses Emscripten for target code, UCRT MinGW-w64 GCC only for host generators, prepared QEMU keymap sources, and replayable Emscripten-only patches. M1 T5 recorded the controlled local-media and native BIOS/POST display baseline; its Personaware/Easy-Setup and audible-output acceptance debt remains tracked. M2 T1–T2 then delivered the PC110-adapted browser bridge, display path, and input path. M2 T3 added a consent-first build bootstrap and startup-failure recovery. M3 T1 delivered responsive controls, and M3 T2 completed the independent clean Windows build and browser-boot validation. M0 Td S8 then established the integrated repository target and moved global governance to `docs/`.

Recent closures: M1 T3 S1 P1 recorded and then retired the MSYS2 experiment; M1 T2 S1 P1 recorded two cloud-runner setup failures, then was superseded and its repository-root workflow commits were removed at the user's direction; M1 T1 S1 P1 confirmed the QEMU 11.0.2 Emscripten path; M0 Td S5 P1 activated and pushed `main` → `pc110/main` → `web/main`. Commit-scope isolation remains mandatory; see `etc/UPSTREAM_INTEGRATION.md`.
