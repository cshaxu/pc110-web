# M3 T4 S1 P1: Next.js Application Host

**State:** Closed

**Original request:** Make PC110 Web work as a Next.js application.

## Result

The repository now has a Next.js 16 App Router application in `src/app/`. Its
client page hosts the validated browser emulator harness and serves the prepared
QEMU runtime from `public/emulator/`. The QEMU build remains a separate local
toolchain under `scripts/qemu-build/`.

## Verification

- `npm run build` completed successfully and generated the static `/` route.
- `npm test` completed successfully: the TypeScript emulator type-check and
  both runtime contract tests passed.
- `npm run dev` starts Next.js successfully. A previously interrupted local
  dev process held the Next development lock during final HTTP retesting; the
  production build is the authoritative completed verification.

## Non-goals

This Part does not add a runtime manifest, default PC110 ROM/disk media, or a
Vercel deployment configuration.
