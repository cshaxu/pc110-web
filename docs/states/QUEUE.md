# Candidate Queue

| Priority | Candidate | Proposal | Admission condition |
| --- | --- | --- | --- |
| Deferred acceptance debt | M1 T5 S1 P1 PC110 behavioral baseline | `history/M1-T5-S1-P1-pc110-local-asset-baseline.md` | Personaware/Easy-Setup interaction and audible output require end-to-end evidence |
| Verified | M2 T1 S1 P1 PC110 WASM artifact | `history/M2-T1-S1-P1-pc110-wasm-bridge.md` | PC110 device/POST compile evidence, artifact manifest, and ES-module import smoke |
| Verified | M2 T1 S2 P1 browser session contract | `history/M2-T1-S2-P1-browser-session-contract.md` | TypeScript type-check and lifecycle contract test |
| Verified | M2 T2 S1 P1 display-capable Emscripten runtime | `history/M2-T2-S1-P1-display-capable-emscripten-runtime.md` | Browser display and PC110 INT19 evidence |
| Verified | M3 T2 S1 P1 clean Windows WASM build | `history/M3-T2-S1-P1-clean-windows-wasm-build.md` | Fresh dependency sysroot, full QEMU artifact, checksums, contracts, and browser boot |
| Closed | M0 Td S8 P1 integrated repository layout | `history/M0-Td-S8-P1-integrated-repository-layout.md` | Root governance and integrated target layout are current |
| Verified | M3 T3 S1 P1 integrated runtime structure migration | `history/M3-T3-S1-P1-integrated-runtime-structure-migration.md` | Root type-check, emulator contract tests, and migrated harness serving |
| Verified | M3 T4 S1 P1 Next.js application host | `history/M3-T4-S1-P1-nextjs-application-host.md` | Next production build and emulator contract tests |
| Verified | M3 T5 S1 P1 dual-ABI incremental WASM build optimization | `history/M3-T5-S1-P1-dual-abi-incremental-wasm-build.md` | Variant contract, invalidation matrix, and implementation sequence are admitted |
| Verified | M3 T5 S1 P2 wasm64 incremental artifact build | `history/M3-T5-S1-P2-wasm64-incremental-artifact-build.md` | Reuse a configured wasm64 Ninja graph; reject wasm32 until independently verified |

Candidates are unnumbered. They must not begin implementation or occupy `CURRENT.md`.
