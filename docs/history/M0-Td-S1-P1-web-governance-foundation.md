# M0 Td S1 P1 Web Governance and Early Planning

## Original Request

The following is an English translation of the user's Chinese request, retained in English at the user's direction: create a `web` subdirectory at repository root as the Web development target for the forked QEMU-based PC110 emulator; minimize changes outside `web`, keep an exception register for any such change, establish early planning and a governance-document system, and use NXVM's governance model as reference.

## Task Brief

**Goal:** Establish executable MTSP controls, define the Web/machine boundary, protect QEMU upstream mergeability, and create the `web/` development root.

**Non-goals:** Modify QEMU, add a WASM toolchain, implement UI, or distribute assets.

**Baseline:** `bae390e`; the native script downloads QEMU 11.0.2 and applies the existing PC110 patch set.

**Applicable rules:** `web/docs/rules/{DOCUMENT,EXECUTION,ARCHITECTURE,CODING}.md`.

**Stop condition:** Stop and reconsider layout if the existing repository cannot accept `web/docs/` and `web/`; this did not occur.

## MTSP Breakdown and Result

| Level | Item | Completion condition | Result |
| --- | --- | --- | --- |
| M0 | Governance and baseline | One current authority, roadmap, and scope protection | Complete |
| M0 Td S1 P1 | Documentation and Web boundary | Documentation system and `web/` root exist | Complete |
| S1 | Baseline audit | QEMU download/patch model and HEAD confirmed | Complete |
| S2 | Documentation authorities | Rules, design, state, proposal, and history are discoverable | Complete |
| S3 | Scope control | Changes outside Web require prior registration | Complete |
| P1 | `web/README.md` | Declares the sole Web development location | Complete |
| P2 | Exception register | Has a defined format and initially protects Web scope | Complete |
| P3 | M1 proposal | Unnumbered candidate has a boundary and stop condition | Complete |

## Requirement Ledger and Evidence

| Original requirement | Result and evidence |
| --- | --- |
| Create `web/` | `web/README.md` exists; runtime code has not begun |
| Minimize changes outside Web | `web/docs/etc/WEB_SCOPE_EXCEPTIONS.md` requires registration; governance documentation now lives under `web/docs/` |
| Govern exceptions | The exception register defines the required pre-registration process for any non-Web path |
| Establish early planning and governance | `web/docs/rules/`, `web/docs/design/`, `web/docs/states/`, the M1 proposal, and this record |
| Preserve mergeability | Architecture and coding rules require replayable patch series for Web QEMU changes |
| Use English documentation | All M0 Td S1 P1 governance, planning, state, proposal, and Web documents are English; a character scan is part of verification |

## Verification and Closure Audit

- Read repository README, LICENSE, build script, and existing QEMU patch layout; confirmed an external QEMU source plus repository patch model.
- The Task path audit contains only `web/**`; it contains no QEMU source, native-script, root-documentation, or asset change.
- Markdown entry-point links, state/queue/proposal cross-links, whitespace, and English-document checks pass.
- Remaining work: M1 remains an unnumbered candidate and was not implemented early.

## Follow-up Governance Decision

The owner later added a non-negotiable commit-scope rule: each authored non-merge commit changes either `web/**` only or non-Web paths only, never both. The rule, branch topology, upstream trailers, and required validation are authoritative in `../rules/EXECUTION.md` and `../etc/UPSTREAM_INTEGRATION.md`.
