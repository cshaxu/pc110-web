# M3 T3 S1 P1: Integrated Runtime Structure Migration

**State:** Closed

**Original request:** Execute the approved code migration so the repository
structure is clear and stable.

## Goal

Move the existing, validated emulator implementation into the integrated
repository layout without changing QEMU behavior: `src/emulator/`,
`qemu/patches/`, `scripts/{dev,qemu-build}/`, `tests/emulator/`, root package
metadata, and the root PC110-QEMU lock file.

## Non-goals

Do not introduce Next.js implementation, modify QEMU patches, rebuild QEMU,
add public media, or deploy to Vercel.

## Acceptance criteria

1. TypeScript source, tests, package metadata, and lock file use their target
   paths.
2. The standalone harness is served from the repository root.
3. QEMU build scripts resolve the repository root and `qemu/patches/`.
4. Existing type-check and emulator contract tests pass unchanged in behavior.
5. The old tracked `emulation/` implementation tree is absent.

## Verification evidence

- `npm run typecheck` completed successfully from the repository root.
- `npm test` completed successfully from the repository root:
  `pc110-session-contract=ok` and `emscripten-qemu-recovery=ok`.
- `npm run serve` served the migrated standalone harness on port 5191:
  `/`, `/src/emulator/harness/app.css`, and
  `/dist/src/emulator/harness/app.js` each returned HTTP 200.
- The migration removes the tracked `emulation/` implementation tree. Ignored
  legacy caches may remain local and are not part of the repository layout.

## Closure audit

The approved source, patch, script, test, package, lock, and public-directory
boundaries now exist at their target paths. This Part intentionally did not
implement the Next.js application or a runtime manifest; those remain later
M3 work.
