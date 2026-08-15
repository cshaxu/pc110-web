# Coding Rules

This repository follows the shared `coding-governance` skill. The intended source layout is in `../design/CODING.md`.

- New Web code uses TypeScript. Public bridge interfaces are explicit, narrow, typed, and testable.
- QEMU patches have one responsibility, a replayable order, their upstream baseline, and a verification command. Generated QEMU source trees and build artifacts are never committed.
- Browser resources, session state, and error paths have clear owners. UI components do not operate a global QEMU Module directly.
- Each Part runs the smallest relevant formatter, type check, build, or browser smoke test. A bridge change retains both native and Web evidence.
