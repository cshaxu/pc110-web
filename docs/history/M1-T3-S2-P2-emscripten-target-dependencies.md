# M1 T3 S2 P2: Emscripten-target Dependencies

## Task Brief

**State:** Closed.

**Original request:** Continue the Windows-native implementation path until PC110 can run in a browser, without WSL, Docker, or remote execution.

**Goal:** Build a Web-local Emscripten-target dependency sysroot sufficient for the fixed QEMU 11.0.2 Meson configuration, then complete the clean Git Bash configuration and record its manifest.

**Dependency set:** Target-static zlib, libffi, PCRE2, GLib, and pixman, plus a resolver stub, a Web-local Ninja executable, and a host `pkg-config` adapter that reads only the target sysroot's `.pc` files. The set follows the QEMU Emscripten dependency recipe published with the upstream WASM work; source versions and checksums are recorded in the generated manifest before first build.

**Non-goals:** Native Windows or MinGW target libraries, final QEMU compilation, PC110 assets, browser UI, and PC110 behavioral claims. One narrowly scoped replayable QEMU build-system patch was admitted after evidence showed that Windows symbolic-link policy prevents an otherwise successful Emscripten configuration.

## Requirements Ledger

| Requirement | Owner | State | Acceptance evidence |
| --- | --- | --- | --- |
| Define pinned source inputs and target sysroot layout | Web technical lead | Complete | Build manifest contains source revisions, checksums, compiler version, and sysroot paths. |
| Provide host pkg-config restricted to the target `.pc` directory | Web technical lead | Complete | `pkg-config --modversion glib-2.0` resolves the target package with target-only environment variables. |
| Build required WASM target libraries | Web technical lead | Complete | Static archives and `.pc` files exist for zlib, libffi, PCRE2, GLib, and pixman. |
| Complete clean QEMU configuration with the sysroot | Web technical lead | Complete | Fresh build directory contains `config.status`, `build.ninja`, and copied configuration evidence. |
| Preserve isolation and source boundaries | Web technical lead | Complete | Dependencies, sources, and outputs remain ignored under `web/.cache/`; the only QEMU change is a replayable patch under `web/qemu-patches/`; no asset changes occurred. |

## Constraints and Risks

The sysroot must target Emscripten `wasm64`; native Windows libraries are invalid. GLib cross compilation has target-specific configuration requirements and its dependency graph includes zlib, libffi, and a resolver stub. Provisioning may download source archives and install only a host pkg-config executable. If any dependency requires a material QEMU source patch, stop and record the exact evidence for a new admission decision.

## Execution Record

- The Web-local builder was exercised under Git Bash with Emscripten 6.0.6.
- `zlib` 1.3.1 built as a wasm64 static archive and installed its target `.pc` file.
- `libffi` 3.4.7 was rejected by its own configure script because it has no wasm64 Emscripten target. The builder now pins libffi 3.5.2, whose upstream release adds that target; its wasm64 static archive, headers, and `.pc` file were built and installed successfully.
- The Git Bash adapter uses target-local wrappers for `make` and `pkg-config`. It also supplies unspaced command names to libffi's generated Autoconf/Libtool rules, which otherwise embed the spaced Git installation path incorrectly.
- `pixman` 0.44.2 completed a wasm64 static build and installed `libpixman-1.a` plus target headers and metadata. Its warnings concern unavailable host floating-point exceptions and ignored x86-only attributes; they did not fail the build.
- PCRE2 10.45 supplied GLib's static `pcre2-8` dependency. Its optional POSIX wrapper cannot be installed reliably through the Git Bash/MSYS Libtool boundary, so the builder installs the required static archive, headers, and pkg-config data directly after a successful target build.
- GLib 2.84.0 source extraction required excluding the archive's non-build `COPYING` symlink because Git Bash cannot reliably create that symlink during extraction. GLib, GObject, and GIO static archives were built successfully. Two host-specific generated configuration macros (`HAVE_POSIX_SPAWN` and `HAVE_PTHREAD_GETNAME_NP`) are removed before installation because they are invalid for the browser target.
- A Web-local Ninja 1.12.1 binary is provisioned because the installed WinGet Ninja is not executable inside the sandboxed Git Bash build environment. A small `res_query` resolver stub supplies the GLib configuration contract without importing a native resolver library.
- The retained MSYS2 `pkgconf.exe` ignores target search-path variables when invoked inside the Git Bash MSYS environment. The builder therefore invokes it through a Web-local PowerShell adapter that clears the MSYS runtime markers, passes Windows-form target paths, and maps its emitted target flags back to Emscripten-compatible Windows paths. The adapter was verified against the target libffi metadata before the GLib configuration was restarted.
- Meson runs from the Windows Python virtual environment and cannot execute the Git Bash-form adapter path directly. The cross file now uses a Web-local `.cmd` shim for the same target-only adapter; the shim was verified to resolve libffi and emit valid target include and library paths.
- QEMU configuration uses Emscripten `emar` and `emranlib`, target-only pkg-config metadata, and the local Ninja. UCRT MinGW-w64 GCC 16.1.0 is used only as `--host-cc` for QEMU code generators; it never produces target objects.
- The QEMU `keycodemapdb` subproject was fetched once at its QEMU-pinned revision `f5772a62ec52591ff6870b7e8ef32482371f22c6`. The adapter verifies it is present and uses `--disable-download`, so routine configuration does not fetch subprojects.
- QEMU's unconditional install-tree post-configuration script requires Windows symbolic-link privilege. A direct capability probe returned `Administrator privilege required for this operation`. `web/qemu-patches/0001-emscripten-skip-symlink-install-tree.patch` therefore skips only that staging action for the Emscripten host. The patch applies cleanly to QEMU 11.0.2 and reverses cleanly after application.
- A clean Git Bash configuration produced `config.status`, `build.ninja`, `config-host.mak`, and a copied record under `web/.cache/qemu-record-gitbash-t4/`. It selected `i386-softmmu`, wasm64 Emscripten, TCG interpreter, and the target static GLib, pixman, zlib, and libffi libraries.

The fixed QEMU checkout and all generated dependencies, configuration output, and source preparation remain ignored under `web/.cache/` or `web/qemu-src/`. No personal asset was inspected, extracted, or changed. Artifact compilation transfers to M1 T4 S1 P1.
