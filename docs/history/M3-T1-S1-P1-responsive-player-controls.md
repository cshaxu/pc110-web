# M3 T1 S1 P1: Responsive Player Controls

## Objective

Make the browser-local PC110 session usable on small displays without changing
the emulated machine, media policy, or QEMU-owned source.

## Scope

- Scale the display canvas to the available viewport while retaining its
  aspect ratio.
- Provide full-screen and normal-window display modes.
- Show selected-file names and sizes, and enable Start only when the required
  inputs are present.
- Provide Restart for an active session.

## Acceptance evidence

- At a 375px browser viewport, the canvas fits its display container without
  horizontal overflow.
- Start is disabled before all required inputs are selected.
- TypeScript and browser-bridge contract tests pass.

## Boundaries

The controls continue to select local files only. They neither upload nor
redistribute firmware, ROMs, disk images, or Easy-Setup data.
