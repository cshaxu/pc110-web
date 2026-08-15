# PC110 Web

PC110 Web is an independent browser-product repository. It contains two
product layers:

- `emulation/`: the QEMU/PC110 WebAssembly adapter, browser runtime, tests,
  reproducible local toolchain, and governance.
- `frontend/`: reserved for the future Next.js user-facing application.

The simulator core is not vendored here. The `emulation` build retrieves the
exact PC110-QEMU source recorded in `emulation/pc110-qemu.lock.json` into a
local ignored cache, then applies the Web-owned patch series. This repository
does not contain firmware, ROM, disk, or other media binaries.

See [`emulation/README.md`](emulation/README.md) for local development and
[`emulation/docs/etc/PC110_QEMU_DEPENDENCY.md`](emulation/docs/etc/PC110_QEMU_DEPENDENCY.md)
for the dependency and provenance rules.
