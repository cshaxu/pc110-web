# Source Layout (Historical Transition)

This document records the pre-integrated layout. The current target is
`REPOSITORY_LAYOUT.md`; no new code may use the paths below as a destination.

```text
web/
  README.md                 # Module entry point, boundaries, development commands
  package.json              # Web toolchain, after M1 approval
  src/session/              # Session lifecycle and scheduling
  src/ui/                   # Page, Canvas, input, and state
  src/assets/               # User asset import and validation
  src/persistence/          # Browser snapshots
  bridge/                   # Bridge ABI and glue code
  qemu-patches/             # Replayable patches for the fixed baseline
  tests/                    # Browser and bridge regression tests
```

`qemu/` is a build-input boundary, not a browser-runtime source destination.
Web-specific QEMU modifications live in `qemu/patches/`; editing any locked or
upstream-related path requires an independent rationale, upstream-merge review,
and a scope-exception entry.

Each initial `.gitkeep` file is a directory-retention marker only. Replacing one with implementation requires a separately approved implementation Task.
