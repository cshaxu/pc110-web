# Integrated Repository Layout

## Decision

PC110 Web uses one Next.js-oriented repository root. The application and the
browser emulator runtime are distinct source modules, but they are built and
deployed as one product. Governance is repository-wide and never belongs to a
runtime implementation subdirectory.

## Target layout

```text
src/
  app/                            # Next.js App Router and all product components
  emulator/                       # Browser runtime
    runtime/                      # Public manifest, client, types, errors
    bridge/                       # Emscripten QEMU module and browser bridge
    session/                      # PC110 lifecycle and device/media parameters
    harness/                      # Diagnostic-only surface
qemu/
  patches/                        # Replayable patches against locked QEMU
scripts/
  qemu-build/                     # Local Emscripten/QEMU build and package tools
tests/
  app/                            # Application tests
  emulator/                       # Runtime and session tests
  qemu/                           # Patch, artifact, and boot acceptance tests
public/
  emulator/                       # Generated, versioned JS/WASM/manifest files
  pc110/                          # Intentionally deployed ROMs and disk images
docs/                             # MTSP governance, design, states, and history
pc110-qemu.lock.json              # Exact upstream source dependency
```

The existing `emulation/` directory is a transitional implementation layout.
It will be moved in scope-pure implementation Parts; this governance decision
does not move runtime code, build scripts, tests, or media.

## Module boundaries

`src/app/` may import only the stable public API from `src/emulator/runtime/`.
It must not directly import QEMU patch metadata, build scripts, generated
Emscripten internals, or session implementation details. Browser-only module
loading occurs only in Next.js client components.

`src/emulator/` does not depend on React, Next.js routing, deployment SDKs, or
product analytics. It loads the versioned files in `public/emulator/` using the
runtime manifest.

`qemu/patches/` contains unified-diff patch files. Those patches may modify
upstream QEMU C, C++, headers, Meson build definitions, or Python sources, but
the upstream source checkout itself remains ignored and is never vendored.

`scripts/qemu-build/` executes only in an explicit local or dedicated build
environment. A Vercel or Next.js application build must consume a prepared
runtime package and must never compile QEMU.

## Public media

`public/emulator/` is generated release output and has a versioned manifest.
`public/pc110/` is for firmware and disk images deliberately included in this
personal site's deployment. Every file in `public/` is directly downloadable
at its deployment URL. Media selection and download must be demand-driven;
the application must not preload every available disk image.

## Vercel

Vercel deploys from this repository root after Next.js is introduced. The
application build reads `src/app/` and serves `public/`; it does not require a
separate Vercel project or a sibling-directory dependency.
