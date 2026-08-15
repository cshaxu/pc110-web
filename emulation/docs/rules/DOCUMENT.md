# Documentation Rules

This repository follows the shared `documentation-governance` skill with these repository-specific constraints.

- `docs/README.md` is the sole entry point, and every subject has one current authority.
- `docs/design/` contains current product design; `docs/rules/` contains rules; `docs/states/` contains only the operational control plane.
- `web/docs/proposals/` contains unnumbered candidates only. On closure, proposals move to `web/docs/history/<task-id>-<name>-proposal.md`.
- `web/docs/history/` contains only numbered-task records and their archived proposals. It explains history and never overrides current design or state.
- `web/docs/etc/` is restricted to material that cannot belong elsewhere and that has an explicit owner, purpose, and retirement condition. Its dedicated register governs Web scope exceptions.
- When a current authority moves or merges, update this entry point and all direct links; do not duplicate a decision or state.
