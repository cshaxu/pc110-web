# M0 Td S7 P1: Application and Emulator Adapter Boundary Design

**State:** Closed  
**Original request:** Start the application and emulator-adapter structural
split design after completing the full build task.

## Goal

Record an implementation-neutral structure that keeps a future Next.js product
application independent from QEMU/Emscripten details while retaining the
verified standalone emulator harness.

## Scope and exclusions

The task defines layer ownership, runtime manifest/client boundaries, deployment
constraints, and a staged MTSP migration. It does not create Next.js code,
move runtime files, change QEMU, package artifacts, or alter media policy.

## Evidence and closure audit

`docs/design/APPLICATION_ADAPTER_BOUNDARY.md` defines the target tree, runtime
contract, deployment boundary, migration sequence, and invariants. The related
candidate proposal records the implementation admission gates. All changes are
English documentation under `emulation/docs/`; no source or media changed.
