# M2 T3 S1 P1: Cross-Platform Build Bootstrap

## Objective

Provide one explicit-consent command that prepares the local host toolchain and builds the browser QEMU artifact without expanding modifications beyond `web/`.

## Scope

- Add `npm run setup-build` as the user-facing entry point.
- Prompt before host-package installation, SDK download, and compilation.
- Use Git Bash plus explicitly prompted MSYS2 utilities on Windows 11.
- Define native Linux (APT) and macOS (Homebrew) setup routes.
- Ensure the replayed Windows QEMU configuration applies every required Web patch, including the browser input event-proxy pump.

## Acceptance evidence

- The entry point parses on Node 22 and both shell scripts pass Bash syntax validation.
- The existing Windows route remains the only route described as native-build verified.
- Linux and macOS must not be described as build-verified until a native run has produced the standard QEMU artifact and manifest.

## Non-goals

- No QEMU source changes.
- No media distribution or inclusion of local firmware/disk assets.
- No WSL, Docker, or remote executor requirement.
