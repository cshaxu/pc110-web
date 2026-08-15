# M0 Td S5 P1 Branch Topology Activation

## Original Request

The user authorized committing and pushing the Web governance work after defining the required branch topology: `main` is the original-project baseline, `pc110/main` contains non-Web changes, and `web/main` contains Web-only changes rebased on `pc110/main`.

## Task Brief

**Goal:** Materialize and publish the documented branch topology without writing a new commit to `main`.

**Non-goals:** Configure GitHub branch protection, configure an optional `upstream` remote, modify QEMU, or begin M1 technical research.

**Baseline:** `main` pointed to `bae390e`; only `origin/main` existed before this Task.

**Affected boundary:** Git refs and remote branch publication; no product source path is changed by the activation itself. The governance record remains under `web/docs/`.

## MTSP Breakdown and Result

| Level | Item | Completion condition | Result |
| --- | --- | --- | --- |
| M0 | Governance and baseline | Required branches exist and have the intended ancestry | Complete |
| Td | Documentation and governance track | Activation result and remaining protection debt are recorded | Complete |
| S5 | Branch topology activation | `pc110/main` and `web/main` are pushed and tracking | Complete |
| P1 | Ref and remote verification | Ancestry, remote tracking, and main immutability are evidenced | Complete |

## Evidence

| Ref | Commit | Upstream tracking | Result |
| --- | --- | --- | --- |
| `main` | `bae390e` | `origin/main` | No new commit written |
| `pc110/main` | `bae390e` | `origin/pc110/main` | Created and pushed from `main` |
| `web/main` | `2336409` | `origin/web/main` | Created from `pc110/main`, then received the Web-only M0 commit |

## Closure Audit

- The initial Web governance commit changed only `web/**` and is therefore valid on `web/main`.
- GitHub branch protection was not configured or verified through Git. That remains an explicit High-priority debt before an upstream pull request or protected-branch integration.
- M1 technical spike remains the next unnumbered candidate; it was not started by this Task.
