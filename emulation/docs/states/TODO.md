# Debt and Open Items

| Priority | Item | Owner | Admission trigger |
| --- | --- | --- | --- |
| High | Produce the QEMU 11.0.2 no-asset browser artifact with a reproducible Git-Bash-native Windows and Emscripten environment, record its size/memory/startup behavior, then replay the PC110 launch contract | Web technical lead | M1 Git Bash-native toolchain approval |
| High | Record and verify the author-intended PC110 behavioral baseline: BIOS/POST, display, keyboard or equivalent input, audio, and the selected Personaware/Easy-Setup checkpoint using entitled local assets | Web technical lead | M1 Git Bash-native toolchain produces a QEMU artifact |
| High | Configure or explicitly record the absence of host-enforced protection for `main`, `pc110/main`, and `web/main`; optionally configure the original project as `upstream` | Repository maintainer | Before the first upstream pull request or protected-branch integration |
| High | Create a provenance, license, and distribution-scope register for ROMs, fonts, DOS/Personaware, and disks | Release lead | Before any public hosting or preloaded asset |
| Medium | Define Web audio, Worker/OffscreenCanvas, and cross-origin-isolation policy | Web technical lead | Single-thread performance or audio acceptance fails |
| Medium | Extract upstreamable general QEMU changes and maintain an upstream contribution queue | QEMU maintainer | Any Web patch stabilizes |
| High | Add CI or a commit hook that rejects mixed `web/` and non-Web commits | Web technical lead | Before the first implementation Task closes |
| Low | Mobile input and touch interaction | Product lead | Desktop MVP closes |
