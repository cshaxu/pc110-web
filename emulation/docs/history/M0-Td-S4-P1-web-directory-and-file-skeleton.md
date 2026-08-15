# M0 Td S4 P1 Web Directory and File Skeleton

## Original Request

The user approved M0 roadmap planning but restricted the current work to a `Td`: establish directory and file structure only, without beginning PC110-QEMU research or Web implementation.

## Task Brief

**Goal:** Establish the `web/` source and documentation skeleton so later work has explicit ownership boundaries without selecting technology or adding behavior.

**Non-goals:** Research PC110-QEMU, evaluate or install a WASM toolchain, download or build QEMU, create QEMU patches, create a package manifest, implement bridge/UI/session/persistence behavior, or change any path outside `web/**`.

**Baseline:** `web/` already owned governance under `web/docs/` but had no retained source directories. M1 remains the unnumbered WASM technical-spike candidate.

**Affected boundary:** `web/**` only.

## MTSP Breakdown and Result

| Level | Item | Completion condition | Result |
| --- | --- | --- | --- |
| M0 | Governance and baseline | Web layout is explicit without implementation | Complete |
| Td | Documentation and directory-layout track | No technical investigation or runtime behavior is introduced | Complete |
| S4 | Web directory and file skeleton | Ownership directories and repository hygiene exist | Complete |
| P1 | Skeleton declaration | Markers, ignore rules, design/state/rule updates, and history record are aligned | Complete |

## Requirement Ledger and Evidence

| Requirement | Result and evidence |
| --- | --- |
| Set directory structure | `src/session`, `src/ui`, `src/assets`, `src/persistence`, `bridge`, `qemu-patches`, and `tests` exist under `web/` |
| Set file structure | `web/.gitignore`, `web/README.md`, retained markers, and `web/docs/` define ownership without runtime files |
| Do not begin research or implementation | No package manifest, toolchain configuration, QEMU checkout, QEMU patch, source code, or test implementation was added |
| Keep change on Web branch scope | All changed paths are under `web/**` |

## Verification and Closure Audit

- The directory skeleton matches `web/docs/design/CODING.md`.
- English-document, Markdown relative-link, legacy-identifier, and Web-only path checks pass.
- `M1 WASM technical spike` remains unnumbered in the candidate queue; it was not started.
