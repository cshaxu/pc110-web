# PC110-QEMU Dependency

**Owner:** PC110 Web technical lead

**Purpose:** Define how this independent Web repository consumes PC110-QEMU
without vendoring or modifying its source tree.

The authoritative source is `../../pc110-qemu.lock.json`. The setup script
clones that repository and checks out its recorded revision beneath the ignored
`emulation/.cache/pc110-qemu-src/` path. Preparation scripts copy only the
PC110 device sources and replayable core patch series into an ignored QEMU
build copy. Web-only QEMU patches remain in `emulation/qemu-patches/`.

Changing the repository URL or revision requires an MTSP task, a lock-file
update, clean preparation evidence, and an updated compatibility record. No
`pc110-qemu` source or media binary belongs in this repository.
