# Roadmap

| Milestone | Stage outcome | Exit evidence |
| --- | --- | --- |
| M0: Governance and baseline | Documentation control plane, Web-scope protection, QEMU/asset/upstream baselines, and Web source skeleton are explicit | Complete Web documentation entry point, exception register, scope-pure directory skeleton, and closed M0 Td S1–S4 P1 |
| M1: Native QEMU and PC110 spike | A native-host build produces the fixed QEMU 11.0.2 `wasm64` target and proves the existing PC110 machine can reach its documented native behavioral checkpoints | Replayable local command, QEMU artifact manifest, PC110 BIOS/POST checkpoint, input/display/audio evidence, and explicit asset boundary |
| M2: Browser bridge and machine startup | Controlled bridge starts the verified PC110 machine in a browser and displays/receives input | Browser BIOS/Easy-Setup or equivalent checkpoint, bridge-contract tests |
| M3: Usable Web MVP | Canvas UI, asset import, session controls, and minimal persistence | Personaware and Easy-Setup regressions, error and refresh/recovery verification |
| M4: Beta readiness | Performance, compatibility, accessibility, deployment, and asset-release decision | Browser matrix, endurance evidence, release audit |

Each Milestone requires an approved Task packet before implementation. The roadmap does not replace task decomposition.

M1 is intentionally not a compiler-only milestone. Its task sequence must establish the Windows-native build adapter, create a reproducible QEMU artifact, replay the fork's PC110 launch contract with entitled local assets, and compare BIOS, POST, display, input, and audio checkpoints to the existing author-intended behavior before M2 begins.
