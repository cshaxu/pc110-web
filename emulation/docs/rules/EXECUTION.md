# Execution Rules

This repository follows the shared `execution-governance` skill and uses the following MTSP controls.

- State machine: accepted → planned → active → implemented → verified → closed. A blocked or deferred item names its owner, reason, and re-entry condition.
- A `Milestone` is an externally verifiable stage outcome. A `Task` has one owner and an identifier. A `Subtask` is a verifiable 1–3 day unit. A `Part` is the smallest independently reviewable change.
- An unnumbered candidate needs a proposal in `web/docs/proposals/` before it enters `states/QUEUE.md`. Only explicit approval and entry into `states/CURRENT.md` allocate its MTSP identifier and a `history/` main record.
- Product implementation uses the ordinary MTSP hierarchy. A standalone documentation or governance change uses the dedicated format `M0 Td Sn P1`, where `n` is the next sequential governance-subtask number. Its history filename uses the equivalent `M0-Td-Sn-P1-<name>.md` form.
- A `Td` item establishes or corrects governance, documentation, directory layout, or file layout only. It must explicitly exclude PC110-QEMU technical research, WASM toolchain selection, QEMU patching, and runtime implementation unless a separate approved task admits that work.
- Only one Subtask is active by default. Parallel work must declare non-overlapping file ownership, resources, and verification scope in its task record.
- Every Task records the original request, goals and non-goals, affected boundaries, risks and dependencies, acceptance criteria, verification evidence, and closure audit.
- Web work, including its documentation, changes `web/` by default. Any root-level or pre-existing path must first be registered in `etc/WEB_SCOPE_EXCEPTIONS.md`, then implemented and verified.
- **Commit-scope rule (non-negotiable):** every authored non-merge commit changes either only paths under `web/` or only paths outside `web/`. A commit that changes both path sets is invalid. A cross-boundary rename is invalid for the same reason.
- A scope-exception approval permits an out-of-`web/` change; it never permits mixing that change with `web/` paths in one commit. A feature that needs both scopes is a stack of separate, scope-pure commits.
- Protected integration branches use fast-forward or rebase-and-merge only. Do not squash a mixed-scope stack or create a regular merge commit that obscures its scope-pure history.
- A non-Web change intended for upstream review carries `Upstream-Status: candidate` and `Upstream-Base: <baseline>` trailers. Fork-only non-Web changes carry `Upstream-Status: fork-only` and a `Reason:` trailer.
- Before closure, reread and map every original request to a result and evidence. An unverified item may remain only as approved deferral or recorded debt.
