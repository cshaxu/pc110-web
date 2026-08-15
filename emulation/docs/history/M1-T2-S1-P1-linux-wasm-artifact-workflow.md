# M1 T2 S1 P1: Linux WASM Artifact Workflow

## Task Brief

**State:** Closed as superseded.

**Original request:** Use a GitHub-hosted Linux runner because no local Linux or WSL environment is available, then continue with the Web version work.

**Context:** M1 T1 S1 P1 confirmed the QEMU 11.0.2 Emscripten host path and deferred artifact generation because Git-for-Windows/MSYS is not an accepted QEMU build host. GitHub-hosted Linux runners provide the required POSIX build environment without changing the developer workstation.

**Approach:** Add a Linux workflow triggered only by a dedicated `m1-wasm-spike-*` tag as the sole approved out-of-`web/` exception and a Web-owned build script. GitHub requires `workflow_dispatch` files on the default branch, while the project's default `main` intentionally remains the original baseline; a dedicated tag preserves that boundary and prevents ordinary `web/main` commits from triggering builds. Build only the unmodified QEMU 11.0.2 `i386-softmmu` no-asset baseline with Emscripten 6.0.6, upload a bounded artifact bundle and logs, then inspect the run before admitting PC110 device or patch work.

**Affected boundaries:** `web/scripts/` owns the reproducible command and output collection. `web/docs/` owns task state and evidence. `.github/workflows/m1-wasm-artifact.yml` is an approved executor-only exception under WSE-001. QEMU source is downloaded into the runner's temporary directory and is never committed.

**Non-goals:** PC110 device installation, patch replay, ROMs, disks, browser UI, bridge API, audio, persistence, automatic builds on every push, public hosting, or changes to root build scripts.

**Risks and stop conditions:** The workflow may fail during configuration, link, or no-asset startup. Record the exact failure and create a route-change proposal if it needs a material QEMU-core redesign. Do not add proprietary assets or broaden the workflow trigger as a workaround.

**Closure decision:** The user directed removal of the repository-root workflow and its commits. The workflow route is therefore not an active or approved implementation path. Its evidence remains historical; its scope exception was removed, its trigger tags were deleted, and the successor candidate validates the same QEMU/Emscripten question locally on Windows.

## Requirements Ledger

| Requirement | Owner | State | Acceptance evidence |
| --- | --- | --- | --- |
| Use a remote Linux environment instead of local MSYS | Web technical lead | Active | An `ubuntu-24.04` workflow run triggered by a dedicated `m1-wasm-spike-*` tag. |
| Pin and record the QEMU and Emscripten baseline | Web technical lead | Active | Workflow provenance file and job log show QEMU `v11.0.2` revision and Emscripten 6.0.6. |
| Build no-asset `i386-softmmu` and retain diagnostics | Web technical lead | Active | Uploaded bounded artifact bundle contains the emulator outputs, metadata, and logs. |
| Preserve Web/non-Web commit isolation | Web technical lead | Active | One Web-only commit for script/docs and one `.github/**`-only executor commit. |

## Planned Verification

1. Shell syntax-check the Web build script locally where possible.
2. Validate workflow YAML structure and ensure it is tag-only.
3. Push the scope-pure commit stack and a dedicated `m1-wasm-spike-*` tag.
4. Inspect the job conclusion, artifact manifest, artifact size, and QEMU/Emscripten provenance.
5. Archive this task's proposal, update states and debt, and close only after the evidence is recorded.

## Runtime Evidence

### Attempt 1: `m1-wasm-spike-r1`

The dedicated tag started GitHub Actions run `31833005998` on `ubuntu-24.04`, proving that the non-default-branch workflow is discoverable through the tag trigger. The run failed after 42 seconds with exit code 126 before QEMU configuration. Its 241-byte artifact contained only the workflow log. The cause was the Web build script being committed with Git mode `100644`; the runner could not execute `web/scripts/build-qemu-wasm.sh` directly.

**Correction:** change only the script's Git mode to `100755`, retain the tag-only trigger, and rerun under a new dedicated tag. This is a task-local workflow correction, not a QEMU or WASM failure.

### Attempt 2: `m1-wasm-spike-r2`

The executable-bit correction allowed the same Linux runner to execute the build script. QEMU source checkout, Emscripten activation, and Python virtual-environment setup completed. Configuration then stopped with `ERROR: Unrecognized host OS (uname -s reports 'Linux')`.

The cause is precise: QEMU 11.0.2 tests the legacy `EMSCRIPTEN` macro to identify its Emscripten host, while current Emscripten documents `__EMSCRIPTEN__` as its guaranteed macro. The runner's compiler did not provide the legacy spelling by default, so QEMU's host probe reached its fallback failure. The next controlled attempt adds `--extra-cflags=-DEMSCRIPTEN`; it changes no QEMU source and makes the macro expected by the pinned baseline explicit.

## Closure Audit

The task did not produce a QEMU browser artifact, so its acceptance requirements are not claimed as complete. The repository-root executor was intentionally removed before the third attempt could run. The preserved findings are: GitHub Actions requires a default-branch workflow for `workflow_dispatch`; a dedicated tag can trigger a workflow stored on `web/main`; and the pinned QEMU baseline needs the legacy `-DEMSCRIPTEN` detection flag with current Emscripten. The M1 Windows local environment proposal owns the unresolved artifact validation.
