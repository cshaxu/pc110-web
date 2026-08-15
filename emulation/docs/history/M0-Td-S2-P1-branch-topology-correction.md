# M0 Td S2 P1 Branch Topology Correction

## Original Request

The user clarified the intended model: `main` is the original-project `main`; `pc110/main` contains all non-Web changes relative to `main`; and `web/main` is rebased on `pc110/main` and contains only the Web layer. The user then requested that governance documentation be corrected.

## Task Brief

**Goal:** Make the documented branch topology match the clarified model without changing Git refs, remotes, source code, or Web files.

**Non-goals:** Create branches, configure remotes, rebase history, commit changes, or alter QEMU/Web implementation.

**Baseline:** Governance documentation before M0 Td S2 P1 described `upstream/main` as the first topology node, while the user has made local `main` the canonical baseline.

**Affected boundary:** `web/docs/**` only. Commit-scope isolation remains mandatory.

## MTSP Breakdown and Result

| Level | Item | Completion condition | Result |
| --- | --- | --- | --- |
| M0 | Governance and baseline | Current governance matches branch ownership | Complete |
| M0 Td S2 P1 | Branch topology correction | `main → pc110/main → web/main` is authoritative | Complete |
| S1 | Topology authority | Integration document distinguishes branch topology from optional remote tracking | Complete |
| S2 | State and debt alignment | Current status and TODO reflect the same topology | Complete |
| P1 | Integration-model edit | `main` is documented as the original-project baseline | Complete |
| P2 | Operational debt | Actual branch and remote setup is tracked before the first authored commit | Complete |

## Requirement Ledger and Evidence

| Requirement | Result and evidence |
| --- | --- |
| `main` is the original baseline | `etc/UPSTREAM_INTEGRATION.md` defines `main` as the local original-project baseline |
| `pc110/main` contains non-Web work | The topology and branch rules restrict it to commits with no `web/**` paths |
| `web/main` sits on `pc110/main` | The topology and update rule require rebase or fast-forward from `pc110/main` |
| Correct governance documentation | Integration model, `CURRENT.md`, and `TODO.md` were aligned |

## Verification and Closure Audit

- This Task changed only `web/docs/**`; it neither changes nor creates Git branches or remotes.
- The integration document still requires scope-pure commits and upstream PRs only from non-Web history.
- English-document and Markdown relative-link checks pass after the correction.
- Actual branch topology creation remains explicit High-priority debt and is not claimed as complete.
