# PC110 Web

PC110 Web is an independent browser-product repository. Its target is one
integrated Next.js product with a clearly bounded emulator runtime:

- `src/app/`: the Next.js user-facing application.
- `src/emulator/`: the browser PC110 runtime, session, bridge, and diagnostic
  harness.
- `qemu/patches/` and `scripts/qemu-build/`: replayable QEMU build inputs and
  local build tooling, outside the runtime source tree.
- `docs/`: repository-wide MTSP governance, design, state, and history.

The simulator core is not vendored here. The local build retrieves the exact
PC110-QEMU source recorded in `pc110-qemu.lock.json` into an ignored cache,
then applies the Web-owned patch series. Released runtime files belong in
`public/emulator/`; selected PC110 firmware and disks may be served from
`public/pc110/` when intentionally added to this personal deployment.

See [`docs/design/REPOSITORY_LAYOUT.md`](docs/design/REPOSITORY_LAYOUT.md) for
the target layout and [`docs/etc/PC110_QEMU_DEPENDENCY.md`](docs/etc/PC110_QEMU_DEPENDENCY.md)
for the dependency and provenance rules.

For the currently validated standalone emulator harness, run `npm run serve`
from the repository root. See [`docs/development/LOCAL_BUILD.md`](docs/development/LOCAL_BUILD.md)
for local build and runtime instructions.
