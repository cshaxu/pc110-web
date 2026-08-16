# M3 T5 S1 P1: Dual-ABI Incremental WASM Build Optimization

**State:** Active  
**Owner:** Web technical lead  
**Original request:** Create an MTSP Task that optimizes the emulator build so
that routine changes rebuild only affected QEMU targets, while supporting
independent wasm32 and wasm64 builds.

## Objective

Replace the fresh-stage-oriented build workflow with durable, variant-isolated
build directories. A routine source or replayable-patch change must reuse the
matching dependency sysroot and Meson/Ninja build graph, compile only
invalidated targets, and relink the selected QEMU browser artifact.

## Scope

- Define a stable `wasm32` and `wasm64` variant key and separate cache layout.
- Add an incremental QEMU artifact command that invokes Ninja against an
  existing variant-specific build directory.
- Preserve a separate clean/full build path for dependency, configuration, or
  toolchain changes.
- Record variant configuration, artifact manifests, and exact invalidation
  rules.
- Add script-level tests for variant isolation and incremental-target selection.

## Non-goals

- Do not change PC110 device behavior, firmware, disk media, UI, or input
  semantics.
- Do not claim wasm32 browser compatibility before it is independently built,
  imported, and browser-boot tested.
- Do not reuse a wasm64 dependency sysroot or Meson build directory for wasm32,
  or vice versa.
- Do not commit caches, generated build directories, SDKs, dependencies, or
  personal media.

## Variant Contract

Each ABI owns the following mutually exclusive paths under repository-root
`.cache/`:

```text
wasm32:
  qemu-git-wasm32
  pc110-wasm-src-wasm32
  wasm-deps-wasm32
  wasm-sysroot-wasm32
  pc110-wasm-build-wasm32
  pc110-wasm-record-wasm32
  emulator-wasm32

wasm64:
  qemu-git-wasm64
  pc110-wasm-src-wasm64
  wasm-deps-wasm64
  wasm-sysroot-wasm64
  pc110-wasm-build-wasm64
  pc110-wasm-record-wasm64
  emulator-wasm64
```

`emulator-<variant>` is a cache candidate artifact directory; publishing into
`public/emulator/` is an explicit, separately verified promotion. The selected
variant is explicit in command arguments and record files; it is never inferred
from an existing directory.

## Subtask Sequence

| Item | Outcome | Boundary | Acceptance evidence |
| --- | --- | --- | --- |
| M3 T5 S1 P1 | Specify variant cache keys, script command contract, invalidation matrix, and test plan | `docs/` | This task record, current state, and queue entry agree |
| M3 T5 S1 P2 | Implement incremental artifact rebuild for the already validated wasm64 variant | `scripts/qemu-build/`, `tests/qemu/` | A web-display-only change recompiles its object and relinks the artifact without rebuilding dependencies or unrelated QEMU objects |
| M3 T5 S2 P1 | Add independent wasm32 clean and incremental configuration paths | `scripts/qemu-build/`, `tests/qemu/` | wasm32 and wasm64 paths cannot share a sysroot, build dir, record, or artifact directory |
| M3 T5 S2 P2 | Verify both variants | release package, `tests/` | Per-variant manifests, JS module import, and browser boot evidence; wasm32 support remains deferred if any gate fails |
| M3 T5 S3 P1 | Define runtime variant-selection policy | `src/emulator/`, `docs/` | Explicit capability/manifest policy with deterministic fallback and user-visible diagnostic |

## Invalidation Matrix

| Change | Required action |
| --- | --- |
| QEMU C source or replayable patch | Refresh only the selected prepared source, then run target Ninja rebuild and relink that variant |
| TypeScript/UI code | No QEMU build; run application checks only |
| Firmware or disk content | No QEMU build; run local boot validation where authorized |
| Emscripten version, target ABI, configure flag, QEMU baseline, or dependency recipe | Reconfigure and perform a clean build for the affected variant only |
| Shared build-script contract | Validate both variant paths; do not silently reuse stale configuration |

## Risks and Dependencies

- QEMU's wasm64 configuration is currently proven; wasm32 may expose distinct
  pointer-size, memory, pthread, or dependency constraints.
- Final Emscripten linking remains necessary after an incremental object
  rebuild; this Task optimizes compilation and dependency setup, not link time
  to zero.
- Patch replay must remain deterministic. An incremental source refresh must
  fail clearly on patch conflicts rather than editing generated source in place.
- The project requires Windows-native Git Bash as its currently validated host
  route; cross-host support is an independent acceptance concern.

## Closure Audit

This Part closes only when the command and cache contract are documented,
variant isolation is unambiguous, all later Parts have non-overlapping
boundaries, and no implementation is claimed complete. The implementation and
verification Parts remain active work under M3 T5.
