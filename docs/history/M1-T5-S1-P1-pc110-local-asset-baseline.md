# M1 T5 S1 P1: PC110 Local Asset Baseline

## Task Brief

**State:** Active.

**Original request:** Implement browser-resident PC110-QEMU emulation that users can operate according to the original project's intent.

**Goal:** Establish a controlled, local-only evidence path from the user-designated PC110 media archive to the fork's existing launch contract. Record the native BIOS/POST, display, input, audio, and selected Personaware/Easy-Setup checkpoints before browser integration claims are made.

**Authorized input:** `O:\assets\PC110Atlas-Personal-Media.zip`, identified by the user as a local test asset. This identification authorizes read-only inspection and local test use for this Task only. It does not authorize committing, copying into the repository, embedding, publishing, redistributing, or claiming a license for any archive member.

## Asset-Handling Procedure

1. Access the archive in place and read-only. Record its SHA-256, byte size, timestamp, and member-path inventory before any extraction.
2. Extract only the minimal files needed for a local native replay into an ignored directory under `web/.cache/`; never extract into a tracked path.
3. Record only non-content metadata, selected roles, and hashes in this Task record. Do not attach, copy, or commit media bytes.
4. Use a local-only QEMU invocation. Disable networking unless the pre-existing launch contract makes a local device requirement explicit.
5. Capture observable checkpoints and command output under ignored `web/.cache/`. Screen captures, recordings, and media derivatives remain local unless a separate distribution decision admits them.
6. On each command, verify that Git status changes only under `web/**`; any asset file in the worktree is a stop condition.

## Requirements Ledger

| Requirement | State | Acceptance evidence |
| --- | --- | --- |
| Archive integrity and non-distribution boundary | Complete | SHA-256, size, read-only member inventory, and Git-status guard recorded. |
| Identify the existing fork launch contract | Complete | Native script/configuration and its required BIOS, ROM, disk, and device roles recorded. |
| Native BIOS/POST and display baseline | Complete | Native executable, BIOS-to-disk handoff, and a loopback RFB framebuffer capture are verified. |
| Input and audio baseline | Active | The loopback RFB keyboard transport accepts a key event; observable application-level interaction and audible PC-speaker output remain pending. |
| Personaware/Easy-Setup checkpoint | Pending | Selected application/setup state reached, or exact documented blocker. |
| Web scope isolation | Active | No archive member, derivative, or root-path modification committed. |

## Read-Only Inventory Evidence

- Archive: `O:\assets\PC110Atlas-Personal-Media.zip`; 6,916,288 bytes; archive SHA-256 `3182DECB37B5E184FF2F2C01A5898536AE92847997A0A88923C315A06C8AA0EE`.
- The archive contains 13 entries. Its embedded member-hash manifest matched independently computed SHA-256 values for every non-directory member.
- Required role candidates: BIOS `pc110_bios.bin` (262,144 bytes; SHA-256 `232101c88466f311bcc32fbc215a4d7569f695ce19f9c07ca67ce2aee5232312`), font ROM `MSM538032E@SOP44.BIN` (1,048,576 bytes; SHA-256 `9829fdb8281c12022dc3b77686044ed1a5213ab526ce4329f2841cd64171784c`), and default Personaware disk `Personaware.img` (4,194,304 bytes; SHA-256 `5149db391d13cfeab330016fcf0edbe6b0d379cbb66a3aed91dbf7684142d52e`).
- The two approximately 16 KiB controller-firmware members and alternate Personaware images are retained in the archive but are not required by the author-defined real-BIOS baseline.
- Structural validation passed without extraction: the BIOS ends in reset vector `EA 5B E0 00 F0`; the font ROM reports `55 AA`, `FONT`, and `84G7940` at the expected offsets; the default disk has an `55 AA` boot signature and one FAT12 partition at LBA 32 with 8,160 sectors.

## Existing Native Launch Contract

`scripts/run-realbios.sh` is the baseline contract. It requires the BIOS, font ROM, and a 4 MiB disk, launches the PC110-extended `qemu-system-i386`, sets `PC110POST=1` and `PC110BOOT`, uses a 486 CPU with `-icount shift=5`, presents the disk as 128 cylinders × 2 heads × 32 sectors, attaches `pc110-chipset` and `pc110-fontrom`, and enables PC-speaker audio. `scripts/run-easysetup-realbios.sh` uses the same contract plus a locally derived Easy-Setup program extracted from the BIOS.

## Native Replay Preparation

- `prepare-pc110-native-source-gitbash.sh` created an ignored QEMU 11.0.2 source copy at the recorded revision, copied the fork's PC110 devices and POST completer, and applied the six existing PC110 core patches. The copy is isolated under `web/.cache/`; no root source changed.
- `configure-pc110-native-gitbash.sh` addresses Git Bash's Windows venv layout and QEMU's offline Python-wheel requirements. Its corrected venv adapter reaches Meson successfully.
- The initial native configuration stopped before build because the installed UCRT MinGW toolchain had neither `pkg-config` nor a native `glib-2.0` development package. This was an environment dependency, not a media, firmware, source-patch, or QEMU device failure.
- The dependency provision completed with the smallest UCRT64 package set for this replay: `pkgconf`, `glib2`, `SDL2`, and `pixman`, plus their package-manager dependencies. Git Bash remains the shell boundary; UCRT64 supplies the native compiler and libraries.
- QEMU's post-configuration installation-tree symlink staging also fails on native Windows without developer symlink authority. The replayable Web patch now skips that staging-only step for both Emscripten and Windows. A clean native configuration then generated `config.status` and `build.ninja` with GLib 2.88.3 and SDL2 2.32.10.
- The VNC-enabled native PC110 executable completed 1,638 Ninja build steps: `qemu-system-i386.exe` is 80,951,499 bytes with SHA-256 `4081DA88FBBBC2AF3FDCE6DF3BFE126DA381F9756BA015707C74301D603AD6B6`. Its device registry contains `pc110-chipset` and `pc110-fontrom`; its configuration records `CONFIG_VNC` and `pixman 0.46.4`.
- A snapshot-only local boot supplied the BIOS, font ROM, and disk under the author-defined `PC110POST=1` / `PC110BOOT` contract. The POST completer recorded: `INT19: booted ... Personaware-disk.img LBA0 -> 0000:7C00 (sig 55AA) DL=80`. This proves the real-BIOS handoff to the boot sector.
- QEMU 11.0.2 on this build does not expose `screendump` through either HMP or QMP. The replay therefore uses a VNC listener bound to `127.0.0.1:5900` and the replayable `capture-local-rfb-frame.ps1` client. The client completed an RFB 3.8 no-authentication handshake, requested raw encoding, and captured a 720 × 400 POST frame showing `Starting PC DOS...` and `Press F1 for Easy-Setup`. This completes the visible BIOS/POST/display checkpoint without exposing a network service.
- The same RFB client sent an F1 key down/up event and received a subsequent framebuffer update. This proves the local RFB input transport, but the following guest frame stopped at an EMM386 error and does not prove a successful Easy-Setup selection. A deterministic `PC110SETUP=1` replay with the locally extracted 232,185-byte Easy-Setup image (`SHA-256 7128F7C5D4907A8C7F1D7B8C0D64F8617CDA43464F36599D21ED7BBCCAB8FE8B`) reached QEMU's 640 × 480 display initialization but did not produce a guest UI frame. The selected Personaware desktop, working Easy-Setup UI interaction, and audible PC-speaker output remain pending.

## Non-goals

Asset distribution, browser asset import, browser UI, WebAssembly host bridge implementation, public hosting, license conclusions, and any modification outside `web/` are not part of this Part.

## Exit Decision

This Part closes only when the fork's native PC110 launch contract and all listed behavioral checkpoints have evidence, or an exact, reproducible blocker is recorded. Browser integration remains a later Task.
