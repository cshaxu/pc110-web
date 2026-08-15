# M0 Td S6 P1: M1 Windows-native Delivery Governance

## Original Request

Establish an MTSP task sequence for the complete Web objective. The objective is not merely local QEMU compilation: PC110 must ultimately run with the fork's author-intended machine behavior.

## Scope and Decision

This governance Part resets M1 around the user's platform constraint: all supported local work is Windows-native, without Linux, WSL, Docker, or remote execution. Git Bash is the selected POSIX shell host. This Part does not implement a build adapter, patch QEMU, research PC110 behavior, distribute assets, or run an emulator.

## Controlled Task Sequence

| Order | MTSP item | Required outcome | Admission dependency |
| --- | --- | --- | --- |
| 1 | M1 T3 S2 P1 | Git-Bash-native adapter configures QEMU 11.0.2 with the fixed Emscripten baseline | P0 candidate approval |
| 2 | M1 T4 S1 P1 | Reproducible QEMU WASM artifact, manifest, size, memory, and no-asset smoke record | M1 T3 S2 closure |
| 3 | M1 T5 S1 P1 | Existing PC110 launch contract replayed with entitled local assets; BIOS/POST, display, input, audio, and selected Personaware/Easy-Setup checkpoints recorded | M1 T4 closure |
| 4 | M2 T1 S1 P1 | Browser bridge starts the verified PC110 machine and exposes its display/input lifecycle | M1 closure |

## Controlled Test Asset

The user identified `O:\assets\PC110Atlas-Personal-Media.zip` as a local test asset. It is neither a repository input nor a distribution authorization. This Td does not inspect or extract it. `M1 T5 S1 P1` must create the asset-handling procedure before use: local-only location, integrity recording, provenance statement, non-commit guard, and the exact PC110 checkpoints it enables.

## Governance Changes

- `M1 T3 S1 P1` is closed as a superseded MSYS2 experiment; its purpose and cleanup are preserved in its historical record.
- The P0 Git-Bash-native candidate is restored to `states/QUEUE.md` with a proposal.
- M1 now exits only after PC110 behavioral evidence, not after a standalone QEMU artifact.
- The architecture and debt registers name Git Bash as the Windows-native shell boundary and preserve the asset entitlement boundary.

## Verification and Closure Audit

All changes are documentation-only under `web/docs/**`. Current design, state, candidate queue, debt, historical experiment record, and the new candidate proposal agree on the Windows-native constraint and the compiler-to-PC110 task chain. No task is active after this governance reset.
