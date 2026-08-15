# Repository Scope Exception Register

**Owner:** PC110 Web technical lead

**Purpose:** Constrain exceptions to the default rule that one MTSP Part owns
one product boundary, and retain upstream-merge evidence.

**Retirement condition:** A deliberate architecture decision replaces the
integrated source layout.

Before a Part changes more than its declared boundary, add a record with its
Task, rationale, affected paths, upstream relation, verification, and rollback
or removal condition. Governance documentation belongs under `docs/` and is
not an exception. An approved exception never permits unrelated paths in one
commit.

| ID | Status | Task | Exception path | Rationale | Verification and rollback condition |
| --- | --- | --- | --- | --- | --- |

No exception is currently approved. No QEMU source, native script, root-build, root documentation, asset, or repository-root CI change is currently approved.
