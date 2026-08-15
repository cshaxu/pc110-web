# M2 T1 S2 P1: Browser Session Contract

## Task Brief

**State:** Verified.

**Goal:** Define and implement the narrow Web-owned contract that starts the PC110 WASM module from user-selected local files and exposes lifecycle, display, keyboard, and teardown semantics to the page.

## Requirements Ledger

| Requirement | State | Acceptance evidence |
| --- | --- | --- |
| Versioned bridge interface | Complete | Typed public interface covers local-file input, startup, status, display target, module injection, and disposal. |
| Asset boundary | Complete | Bridge accepts in-memory user bytes only and maps them to fixed VFS paths; user names never enter QEMU arguments. |
| QEMU launch contract | Complete | Bridge maps the recorded PC110 BIOS/font/disk/device arguments without page access to QEMU internals. |
| Browser error/lifecycle semantics | Complete | Success, initialization failure, disposal, and state-change paths are unit-tested. |

## Scope

This Part owns `web/bridge/`, `web/src/session/`, their unit tests, and the minimal TypeScript build/test setup required to validate the contract. It does not implement a production Canvas backend, audio path, persistence, or mobile controls; those are separate browser-session Parts after the contract is executable.

## Verification Plan

1. Type-check and unit-test the bridge without any media fixture.
2. Verify argument construction against the native launch record using synthetic `File` metadata only.
3. Import the generated QEMU ES module through a dependency-injected module loader; do not claim QEMU startup until the display-capable browser Part is verified.

## Execution Record

- `bridge/pc110-session.ts` exports bridge version `1`, typed local assets, the fixed PC110 launch plan, a module-factory boundary, and a session state machine.
- The launch plan reserves `/pc110-input/pc110_bios.bin`, `/pc110-input/pc110_fontrom.bin`, and `/pc110-input/Personaware-disk.img`. It maps the native 486, disk geometry, PC110 device, BIOS, and font-ROM arguments while preserving `PC110POST` and `PC110BOOT` environment inputs.
- `tests/pc110-session-contract.spec.ts` uses no media fixture. It verifies fixed-path argument construction, VFS writes, module-factory input, visible `preparing` → `running` → `disposed` transitions, failure reporting, and cleanup after a simulated initialization exception.
- The Web-local TypeScript 5.7.3 toolchain completed `npm run typecheck` and `npm test`; the test output was `pc110-session-contract=ok`.
