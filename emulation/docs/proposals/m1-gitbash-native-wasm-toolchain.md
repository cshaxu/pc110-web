# M1 Git Bash-native WASM Toolchain

## Candidate Purpose

Establish the supported Windows-native build adapter for QEMU 11.0.2 WASM. Git Bash provides the POSIX shell layer; the existing Windows Emscripten SDK, Python, and Ninja provide tool execution. The candidate excludes MSYS2 as a required build dependency and excludes WSL, Docker, and remote execution.

## Intended MTSP Sequence

| Level | Intended item | Outcome |
| --- | --- | --- |
| M1 | Windows-native QEMU and PC110 spike | A reproducible path reaches the PC110 behavioral baseline, not only a compiler artifact. |
| T3 | Windows-native build adapter | Git Bash can configure the fixed QEMU baseline with explicit tool ownership. |
| S2 | Git Bash adapter viability | A versioned Web adapter selects Python, Emscripten, Meson, and Ninja consistently. |
| P1 | Configuration and manifest | QEMU configuration completes and records its exact inputs. |

## Acceptance Gate

The Part is complete only when a clean Git Bash invocation generates the QEMU build configuration and artifact manifest without changing QEMU source. A later Task owns full compilation, and a subsequent Task owns the PC110 BIOS/POST/display/input/audio behavioral comparison with entitled local assets.

The identified future test input is the user-provided local archive `O:\assets\PC110Atlas-Personal-Media.zip`. It is out of repository scope. This candidate must not read, extract, embed, commit, publish, or redistribute it; its successor PC110 behavioral-baseline Task must first define an inspection, provenance, integrity, and local-use procedure.

## Boundaries and Risks

All adapter scripts, records, logs, and build instructions belong under `web/**`. QEMU source remains unpatched unless a separately approved, upstream-oriented Task admits one. The main risk is the path and Python-launcher boundary between Git Bash and Windows Emscripten; failure records must preserve the exact command and first blocker.
