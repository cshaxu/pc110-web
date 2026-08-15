# Project Goal

Deliver a PC110 experience that runs in modern browsers without changing the authority of PC110-QEMU machine simulation or losing the opportunity to contribute work back upstream.

Goals:

1. Run a PC110 session in the browser using QEMU's i386 TCG and the existing PC110 devices and patches, with behavior consistent with the fork's documented native PC110 path.
2. Preserve the current behavioral baseline for the real BIOS, Personaware, Easy-Setup, font ROM, and PC110-specific paths.
3. Let users explicitly select and locally handle assets they are entitled to use; asset distribution has a separate admission decision.
4. Deliver the Web host and QEMU changes as replayable, verifiable patches and interfaces that can be evaluated for upstream contribution.

The primary platform constraint is Windows-native local development. The project must not require Linux, WSL, Docker, or a remote build service for its supported local build path. Git Bash is the selected POSIX shell host; its use does not change the Windows-native platform boundary.

Non-goals: rewriting QEMU or TCG in JavaScript; promising default distribution of IBM assets without a basis; or pursuing multithreading, complete mobile support, or all QEMU machines in the first release.
