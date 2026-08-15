# M1 T3 S1 P1: Windows Local WASM Environment

## Task Brief

**State:** Closed as superseded by `M0 Td S6 P1`.

**Original request:** Remove the non-Web workflow commits and start over with the QEMU build locally on Windows.

**Context:** The repository-root GitHub Actions workflow was removed as requested. The workstation has MSYS2 at `C:\msys64`, including its runtime, UCRT64 GCC, and `make`, but the MSYS2 package database reports missing repository signatures and lacks the Python, Ninja, pkg-config, and Emscripten requirements for this experiment. Git-for-Windows/MSYS is not the same environment as MSYS2 UCRT64.

**Approach:** Repair MSYS2 package trust and update it, install only the required POSIX build tools, then install Emscripten 6.0.6 in an ignored Web-local cache. Verify host macros and configure the fixed QEMU 11.0.2 revision with `--extra-cflags=-DEMSCRIPTEN --cpu=wasm64 --enable-tcg-interpreter`; build no-asset `i386-softmmu` or record the first reproducible blocker.

**Boundaries:** Tool installation changes the local workstation only. Repository changes remain under `web/**`; QEMU source, SDK, and build outputs remain ignored. No root files, QEMU source patches, PC110 devices, ROMs, disks, or browser UI are in scope.

**Risks and stop conditions:** MSYS2 repair and package installation can update local tools and download several gigabytes. If package trust cannot be repaired or QEMU requires a material source redesign after the documented host compatibility flag, stop and record the evidence. Do not alter QEMU core.

## Requirements Ledger

| Requirement | Owner | State | Acceptance evidence |
| --- | --- | --- | --- |
| Remove the non-Web cloud-workflow changes | Web technical lead | Complete | `web/main` history and remote tags contain no `.github/**` workflow commits. |
| Verify the local MSYS2 environment | Web technical lead | Complete | Package trust was repaired; the MSYS2 shell and package boundary were recorded. |
| Install and activate the required Emscripten toolchain | Web technical lead | Complete | Emscripten 6.0.6 compiled a local WASM probe. |
| Configure and build QEMU WASM without source patches | Web technical lead | Superseded | MSYS2-specific adapter experiments were not adopted as a supported path. |

## Closure Audit

The MSYS2 packages installed solely for this experiment were removed after the route decision. The original MSYS2 runtime, UCRT GCC, and `make` remained untouched. Emscripten and the downloaded fixed QEMU source remain ignored Web-local build inputs. The user required a Windows-native local path without WSL, Docker, or remote execution; `M0 Td S6 P1` therefore transferred future work to the Git-Bash-native candidate rather than treating MSYS2 compatibility work as product implementation.
