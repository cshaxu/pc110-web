# M1 WASM Technical Spike

## Context

The existing project downloads QEMU 11.0.2 at build time, installs PC110 devices and patches, and builds `i386-softmmu`. The largest unknowns for Web delivery are the fixed QEMU baseline's browser buildability, runtime model, minimum bridge surface, and resource cost—not page UI.

## Proposal

Create only a reproducible WASM build experiment, patch metadata, and a minimal browser smoke inside `web/`. Do not build a complete UI, preload IBM assets, or alter root QEMU patches or scripts. If an outside change proves unavoidable, register the scope exception before editing.

## Goals and acceptance

1. Record the fixed QEMU source version, toolchain version, configuration flags, patch order, and reproducible commands.
2. Produce a minimal loadable browser artifact and record build success, artifact size, initial memory, and startup-failure behavior.
3. Demonstrate one lifecycle operation and one controlled bridge operation in a browser smoke without copyrighted assets.
4. Produce evidence for a continue, block, or route-change decision.

## Non-goals

Complete Personaware/Easy-Setup operation, public deployment, audio, persistence, multithreading, mobile support, or changes to the existing `qemu/` patch set.

## Risks and stop conditions

If the official or fixed QEMU baseline cannot produce WASM within a reasonable patch scope, or a single-thread resource model cannot support a minimal lifecycle, stop M1 and submit evidence and alternatives as a new proposal. Do not silently rewrite QEMU core as a workaround.
