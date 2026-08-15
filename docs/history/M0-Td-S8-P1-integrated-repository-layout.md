# M0 Td S8 P1: Integrated Repository Layout

**State:** Closed

**Original request:** Govern the repository around one integrated layout:
`src/app`, `src/emulator`, `qemu/patches`, `scripts/qemu-build`, corresponding
`tests`, `public/emulator`, `public/pc110`, a root lock file, and global
documentation. The user explicitly accepted intentionally deployed PC110 ROM
and disk media for a personal site.

## Goal

Make the integrated layout, public-resource ownership, module dependency
rules, and Vercel boundary current repository governance. Move governance from
the transitional `emulation/docs/` location to the repository-root `docs/`.

## Non-goals

Do not move runtime code, build scripts, tests, lock files, or media. Do not
create a Next.js application, compile QEMU, package a runtime, add media, or
deploy to Vercel.

## Affected boundary

Governance only: `docs/` and directly related root metadata. Existing runtime
implementation remains under `emulation/` as a documented transition.

## Acceptance criteria

1. `docs/` is the sole global governance root.
2. The target source, QEMU, scripts, tests, and public-media directories are
   unambiguous.
3. `src/app/` and `src/emulator/` have a one-way, stable runtime API boundary.
4. `public/emulator/` and `public/pc110/` have separate ownership and loading
   rules.
5. Vercel is documented as a repository-root Next.js deployment that consumes
   prepared artifacts rather than compiling QEMU.

## Verification evidence

- `docs/design/REPOSITORY_LAYOUT.md` defines the target layout and module
  boundaries.
- `docs/design/APPLICATION_ADAPTER_BOUNDARY.md` now describes the integrated
  dependency flow and public package locations.
- `docs/rules/{DOCUMENT,EXECUTION,ARCHITECTURE}.md` makes root-level governance
  and scope-pure future migration authoritative.
- No runtime source, build script, test, lock file, artifact, ROM, or disk was
  changed by this Part.

## Closure audit

All requested layout categories are represented. The physical move of
implementation files is intentionally deferred to separately admitted,
verifiable implementation Parts so the previously validated build remains
intact during the governance transition.
