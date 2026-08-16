# M3 T5 S1 P2: wasm64 Incremental Artifact Build

**State:** Verified
**Owner:** Web technical lead
**Depends on:** M3 T5 S1 P1

## Objective

Provide a fail-closed, wasm64-only command that rebuilds `qemu-system-i386.js`
from an existing configured Ninja graph and writes a new cache candidate
artifact. It must reuse the wasm64 dependency sysroot and never select wasm32
paths.

## Command Contract

```text
scripts/qemu-build/incremental-qemu-wasm-gitbash.sh wasm64 \
  .cache/emulator-wasm64-<candidate>
```

The command requires the prepared source, configured build, configuration
record, dependency sysroot, and local Ninja under their wasm64 cache paths. It
does not prepare source, configure QEMU, or build dependencies. A candidate
must be a new directory below `.cache/`; promotion to `public/emulator/` is a
separate release action.

## Acceptance Evidence

- The command rejects wasm32 and missing/mixed wasm64 inputs.
- Its script contract proves isolated source, dependency, sysroot, build, and
  record paths.
- A controlled web-display source invalidation recompiles only its affected
  object(s) and performs final linking, without rebuilding dependencies.

## Verification Record

On the Windows-native Git Bash route, a controlled timestamp invalidation of
`ui/web-display.c` was built through the command contract. Ninja reported only
the web-display object, the final `qemu-system-i386.js` link, and its normal
version-header generation. The resulting candidate artifact was written below
`.cache/`; no dependency build or full QEMU object rebuild ran.
