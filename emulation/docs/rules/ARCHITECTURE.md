# Architecture Rules

This repository follows the shared `architecture-governance` skill. The current architecture design is in `../design/ARCHITECTURE.md`.

- QEMU and its PC110 device models are the sole authority for machine simulation. The Web layer must not reimplement CPU, device state, or BIOS logic.
- `web/` is the browser-product boundary. It owns pages, input, canvas presentation, asset selection, session state, and browser-storage policy.
- Web code interacts with QEMU through one versioned bridge contract; page code must not bypass the bridge to read or mutate QEMU internals.
- Any QEMU source change for the Web product is delivered as a replayable patch series inside `web/`, against a fixed QEMU baseline. A potentially upstreamable general fix must not be polluted with PC110-specific policy.
