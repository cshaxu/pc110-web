# Superseded Proposal: M3 Application and Emulator Adapter Split

**Superseded by:** `M0 Td S8 P1`, which adopted the integrated repository
layout in `docs/design/REPOSITORY_LAYOUT.md`. This pre-decision proposal is
retained as historical candidate context and must not be admitted as written.

## Candidate outcome

Admit a staged task that extracts a versioned emulator runtime contract from
the standalone browser harness and permits a future Next.js application to
consume it without importing QEMU or Emscripten internals.

## Admission gates

- Approve the target structure and public contract in
  [the boundary design](../design/APPLICATION_ADAPTER_BOUNDARY.md).
- Define manifest schema and compatibility policy before frontend code imports
  the runtime.
- Use the integrated `public/emulator/` and `public/pc110/` ownership rules.
- Allocate non-overlapping `emulation/` and `frontend/` commit ownership.

## Exclusions

This candidate does not implement Next.js, change QEMU, deploy to Vercel,
package public artifacts, or redistribute media.
