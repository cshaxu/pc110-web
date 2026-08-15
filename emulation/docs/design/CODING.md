# Source Layout

This is the target layout. M0 creates tracked empty ownership directories and Web-specific ignore rules, but does not create runtime code, a package manifest, build configuration, or a QEMU checkout.

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

`qemu/` is the existing native PC110 QEMU change set, not a Web-code destination. Web-specific QEMU modifications first live in `web/qemu-patches/`; editing a pre-existing root path requires an independent rationale, upstream-merge review, and a scope-exception entry.

Each initial `.gitkeep` file is a directory-retention marker only. Replacing one with implementation requires a separately approved implementation Task.
