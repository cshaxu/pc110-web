# M1 T1 S1 P1: QEMU WASM Baseline Validation

## Task Brief

**State:** Closed as deferred.

**Original request:** Approve the stated M1 work, complete it cleanly, and close the work item.

**Context:** The fork's native build script pins QEMU 11.0.2 and builds `i386-softmmu`. The M1 proposal required a fixed WASM baseline, a reproducible build experiment, and evidence for a continue, block, or route-change decision.

**Approach:** Validate QEMU's exact 11.0.2 source and Emscripten integration before changing PC110 sources, patches, browser UI, or assets. Keep all third-party source, SDK, and generated outputs in ignored paths under `web/`.

**Boundaries:** This task changed only `web/docs/**`. It did not alter the root build script, `qemu/` PC110 sources or patches, ROMs, disks, product source, or public distribution policy.

**Applicable rules:** `web/docs/rules/EXECUTION.md`, `web/docs/rules/ARCHITECTURE.md`, `web/docs/rules/CODING.md`, and the Web-only commit-scope rule.

## Requirements Ledger

| Requirement | Result | Evidence |
| --- | --- | --- |
| Validate whether the fixed QEMU baseline has a viable WASM route | Complete | Exact QEMU 11.0.2 source identifies Emscripten as a host OS and `wasm64` as a supported CPU; the configuration probe reached that path. |
| Establish a replayable source/toolchain/configuration baseline | Complete for configuration; link deferred | Source `e545d8bb9d63e9dd61542b88463183314cff9482` (tag `v11.0.2`), Emscripten 6.0.6, and the command below. |
| Produce and smoke-test a no-asset browser artifact | Deferred | The local host is Windows with Git-for-Windows/MSYS and no WSL; QEMU rejects `MSYS_NT-*` before link. The successor candidate owns this evidence. |
| Avoid unbounded QEMU-core workaround scope | Complete | No QEMU source or patch was changed. The successor uses Linux/WSL instead of an MSYS workaround. |

## Evidence

### Fixed Inputs

| Input | Value |
| --- | --- |
| Project baseline | `bae390e` (`cshaxu/pc110-qemu`, 2026-07-21) |
| QEMU revision | `e545d8bb9d63e9dd61542b88463183314cff9482` (`v11.0.2`) |
| Emscripten SDK | 6.0.6 (`ce75e06884093bcefb86a6b8fd56a5d62a4cc245`) |
| Target | `i386-softmmu` |
| Host model | Emscripten `wasm64`, TCG interpreter |

### Source Evidence

QEMU 11.0.2's `configure` detects `EMSCRIPTEN`, names the host OS `emscripten`, requires `--cpu=wasm64`, and its Meson configuration lists both `emscripten` and `wasm64`. Its TCG configuration explicitly requires `--enable-tcg-interpreter` for a `wasm64` host. The Emscripten compiler reports version 6.0.6 locally.

### Probe Command

Run from a Linux or WSL shell after activating Emscripten. The Windows probe used the same QEMU arguments but stopped before configuration completed because the shell reported an MSYS host.

```sh
emconfigure ../qemu-src/configure \
  --python="$(command -v python3)" \
  --cpu=wasm64 \
  --enable-tcg-interpreter \
  --target-list=i386-softmmu \
  --disable-docs --disable-tools \
  --disable-gtk --disable-sdl --disable-opengl --disable-vnc --disable-curses \
  --disable-gnutls --disable-nettle --disable-gcrypt --disable-curl --disable-slirp \
  --disable-fuse-lseek
emmake make -j"$(nproc)"
```

### Actual Local Result

The Emscripten compiler sanity check succeeded. QEMU located Python 3.13.3 and began its virtual-environment setup. It then exited with:

```text
ERROR: Unrecognized host OS (uname -s reports 'MSYS_NT-10.0-26200')
```

`wsl.exe --status` reported that WSL is not installed. This is an environment incompatibility, not evidence that QEMU's Emscripten route is absent.

## Decision, Risks, and Exit

**Decision:** Continue with the QEMU-based Web route. Do not attempt a Git-for-Windows/MSYS compatibility patch. Admit the Linux/WSL artifact spike before any PC110 patch replay or browser-product work.

**Deferred owner:** Web technical lead.

**Re-entry condition:** A Linux or WSL environment with Emscripten is available and the successor proposal is approved.

**Known risks:** `wasm64` requires the TCG interpreter, so performance and memory remain unmeasured. The official QEMU build-platform page classifies other host architectures as unsupported and cautions that TCI is slow; artifact measurement is therefore a hard M1 gate.

## Verification and Closure Audit

| Check | Result | What it proves |
| --- | --- | --- |
| QEMU tag and revision inspection | Passed | The probe used the declared QEMU 11.0.2 release revision. |
| `emcc --version` | Passed | Emscripten 6.0.6 is installed and executable. |
| Emscripten QEMU configure probe | Deferred at host gate | QEMU recognizes the Emscripten/wasm64 configuration; MSYS is not an admitted host. |
| WSL availability check | Passed (absence recorded) | No local Linux/WSL fallback is available. |
| Web-only scope check | Passed | All authored files for this task are under `web/`. |
| Markdown link and English-content checks | Passed | Documentation remains navigable and English-only. |

No browser artifact, size, memory measurement, or browser smoke is claimed. Those acceptance items are explicitly transferred to the unnumbered successor candidate, not silently dropped.

## Retrospective

The previous assumption that QEMU itself had no Emscripten host path was incorrect for the pinned 11.0.2 baseline. Future tasks must inspect the exact pinned source before treating historical QEMU support assumptions as architecture facts. Platform probes must run in a supported POSIX environment from the beginning; MSYS failures are recorded as environment evidence, not patched into QEMU without a separately approved design decision.
