# Web Scope Exception Register

**Owner:** Web technical lead

**Purpose:** Constrain exceptions to the default rule that Web work changes only `web/`, and retain upstream-merge evidence.

**Retirement condition:** A deliberate architecture decision replaces the `web/` development boundary.

Before editing any file outside `web/`, add a record with its Task, rationale, affected paths, upstream relation, verification, and rollback or removal condition. Web governance documentation belongs under `web/docs/` and is not an exception. An approved exception never permits mixing outside-`web/` and `web/` paths in one commit.

| ID | Status | Task | Exception path | Rationale | Verification and rollback condition |
| --- | --- | --- | --- | --- | --- |

No exception is currently approved. No QEMU source, native script, root-build, root documentation, asset, or repository-root CI change is currently approved.
