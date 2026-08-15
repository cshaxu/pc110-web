# Application and Emulator Adapter Boundary

## Decision

PC110 Web has a one-way dependency inside one integrated product:

```text
src/app/ (Next.js product application)
  -> versioned emulator runtime contract
     -> src/emulator/ (browser adapter and runtime verification)
        -> qemu/patches/ and scripts/qemu-build/ (local build inputs)
        -> locked PC110-QEMU source and QEMU baseline
```

`src/app/` owns routes, product copy, responsive layout, accessibility,
media-selection UX, deployment configuration, and privacy-safe observability.
`src/emulator/` owns machine command construction, browser-to-QEMU bridge,
display/input/audio adaptation, lifecycle semantics, and low-level runtime
tests. `qemu/patches/`, `scripts/qemu-build/`, and the root lock file own the
replayable local toolchain boundary and source provenance.

The frontend must not import QEMU source, QEMU patches, build scripts, or
Emscripten-generated modules directly. The emulator adapter must not depend on
Next.js routing, React state, visual design, analytics, or deployment SDKs.

## Target structure

```text
src/app/                        # Next.js routes, components, and player host
src/emulator/bridge/            # Emscripten module factory and browser bridge
src/emulator/session/           # Machine lifecycle and launch-file contract
src/emulator/runtime/           # Versioned public runtime contract
src/emulator/harness/           # Temporary standalone diagnostic harness
qemu/patches/                   # Replayable Web-only QEMU patch series
scripts/qemu-build/             # Reproducible local build and package scripts
tests/{app,emulator,qemu}/      # Corresponding acceptance and unit tests
public/emulator/                # Immutable published runtime bundle
public/pc110/                   # Intentionally deployed firmware and disks
```

The current standalone UI remains an integration harness until an application
frontend client replaces it. It is not the permanent public product surface.

## Runtime contract

Packaging must produce a versioned `runtime-manifest.json` next to immutable
artifacts. It declares a contract version, runtime build identifier, QEMU and
PC110-QEMU revisions, public artifact paths and SHA-256 values, cross-origin
isolation requirements, supported display/input capabilities, and frontend
compatibility range.

The first frontend-facing interface remains deliberately small:

```ts
interface Pc110RuntimeClient {
  prepare(runtime: RuntimeManifest): Promise<void>;
  start(media: Pc110MediaSelection, target: DisplayTarget): Promise<void>;
  restart(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (event: Pc110RuntimeEvent) => void): () => void;
}
```

Media stays as in-memory browser `File`/byte input. It must never enter route
state, telemetry, local storage, server actions, deployment logs, or the
runtime manifest. QEMU stderr remains internal; the frontend receives stable
event codes and safe messages.

## Deployment boundary

The deployment package contains the application, a generated public runtime
bundle under `public/emulator/`, and intentionally selected PC110 media under
`public/pc110/`. Runtime files are same-origin or explicitly compatible-origin
resources with WASM MIME type and cross-origin-isolation headers. Build caches
and source checkouts are excluded. Deployed PC110 media are public at their
deployment URLs and are loaded on demand rather than universally preloaded.

## Migration sequence

1. **M3 T3 — Runtime contract extraction:** extract manifest schema, artifact
   URL policy, lifecycle events, and adapter-facing errors from the harness.
2. **M3 T4 — Application player host:** create the Next.js shell and implement
   `Pc110RuntimeClient` without changing machine boot semantics.
3. **M3 T5 — Dual-surface acceptance:** prove harness and frontend boot the
   same manifest to the same PC110 POST/INT19 checkpoint.
4. **M4 T1 — Release packaging and deployment:** add CI packaging, manifest
   integrity checks, header validation, and deployment after public asset
   policy approval.

## Invariants

- The emulator has no frontend-framework dependency.
- The frontend does not rebuild, patch, or inspect QEMU at runtime.
- The runtime contract is versioned before frontend implementation begins.
- Private PC110 media remains browser-local.
- Both surfaces share acceptance checkpoints rather than divergent boot paths.
- Each implementation commit remains scope-pure according to the repository
  execution rules.
