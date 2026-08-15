# M0 Td S3 P1 Web Documentation Scope

## Original Request

The user clarified that the governance and planning documents belong in the `web/` directory and therefore belong on `web/main`. The user also required every standalone documentation or governance submission outside product MTSP work to use the identifier format `M0 Td Sn P1`, with variable sequential `n`.

## Task Brief

**Goal:** Place the Web governance system under `web/docs/`, make it a Web-only change set, and establish the required dedicated numbering policy.

**Non-goals:** Modify QEMU, root documentation media, scripts, assets, Git branches, remotes, or product implementation.

**Baseline:** M0 Td S1 P1 and M0 Td S2 P1 governance files existed only as uncommitted repository-root `docs/**` files. The repository-root `docs/` directory also contains pre-existing image media that must remain in place.

**Affected boundary:** `web/**` only.

## MTSP Breakdown and Result

| Level | Item | Completion condition | Result |
| --- | --- | --- | --- |
| M0 | Governance and baseline | Web governance is inside the Web boundary | Complete |
| Td | Documentation and governance track | No product implementation is introduced | Complete |
| S3 | Documentation scope and numbering | `web/docs/` is authoritative and `M0 Td Sn P1` is defined | Complete |
| P1 | Move and reconcile documentation | Links, status, history identifiers, and exceptions are aligned | Complete |

## Requirement Ledger and Evidence

| Requirement | Result and evidence |
| --- | --- |
| Governance documents are in `web/` | Current rules, design, state, proposal, history, and exception authorities are under `web/docs/` |
| Governance commits belong to `web/main` | The resulting worktree changes only `web/**`; it can be committed as a scope-pure Web commit |
| Dedicated governance numbering | `web/docs/rules/EXECUTION.md` defines `M0 Td Sn P1`; prior records are renamed M0 Td S1 P1 and M0 Td S2 P1 |
| Preserve root documentation media | Existing repository-root `docs/` screenshot assets remain outside the Web governance move |

## Verification and Closure Audit

- The change set contains no path outside `web/**`.
- All Web documentation links resolve, English-document checks pass, and no stale root-governance authority remains.
- The current exception register has no approved entry because Web documentation no longer needs a root-level exception.
- M1 remains an unnumbered implementation candidate; this governance change does not start it.
