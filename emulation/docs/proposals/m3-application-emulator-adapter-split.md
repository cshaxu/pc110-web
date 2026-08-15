# Proposal: M3 Application and Emulator Adapter Split

## Candidate outcome

Admit a staged task that extracts a versioned emulator runtime contract from
the standalone browser harness and permits a future Next.js application to
consume it without importing QEMU or Emscripten internals.

## Admission gates

- Approve the target structure and public contract in
  [the boundary design](../design/APPLICATION_ADAPTER_BOUNDARY.md).
- Define manifest schema and compatibility policy before frontend code imports
  the runtime.
- Explicitly preserve the no-redistribution asset policy.
- Allocate non-overlapping `emulation/` and `frontend/` commit ownership.

## Exclusions

This candidate does not implement Next.js, change QEMU, deploy to Vercel,
package public artifacts, or redistribute media.
