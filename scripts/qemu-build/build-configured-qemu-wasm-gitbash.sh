#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <qemu-build-dir> <artifact-dir>" >&2
  exit 64
fi

qemu_build_dir=$1
artifact_dir=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd -P)

qemu_build_dir=$(cd "$qemu_build_dir" && pwd -P)
artifact_parent_input=$(dirname "$artifact_dir")
mkdir -p "$artifact_parent_input"
artifact_parent=$(cd "$artifact_parent_input" && pwd -P)
artifact_dir="$artifact_parent/$(basename "$artifact_dir")"

if [[ ! -f "$qemu_build_dir/build.ninja" ]]; then
  echo "QEMU build directory is not configured: $qemu_build_dir" >&2
  exit 65
fi
if [[ -e "$artifact_dir" ]]; then
  echo "artifact directory must not already exist: $artifact_dir" >&2
  exit 66
fi

source "$script_dir/gitbash-emsdk-env.sh"
unset EMMAKEN_JUST_CONFIGURE

dependency_work_dir=${PC110_WEB_WASM_DEPENDENCY_WORK_DIR:-"$project_root/.cache/wasm-deps-t3"}
ninja_bin="$dependency_work_dir/tools/ninja.exe"
if [[ ! -x "$ninja_bin" ]]; then
  echo "Web-local Ninja was not found: $ninja_bin" >&2
  exit 67
fi

"$ninja_bin" -C "$qemu_build_dir" qemu-system-i386.js
mkdir -p "$artifact_dir"
for output in qemu-system-i386.js qemu-system-i386.wasm config-host.mak; do
  if [[ ! -f "$qemu_build_dir/$output" ]]; then
    echo "required QEMU output was not produced: $output" >&2
    exit 68
  fi
  mkdir -p "$artifact_dir/$(dirname "$output")"
  cp "$qemu_build_dir/$output" "$artifact_dir/$output"
done
qemu_source_dir=$(sed -n 's/^SRC_PATH=//p' "$qemu_build_dir/config-host.mak")
vga_bios="$qemu_source_dir/pc-bios/vgabios-stdvga.bin"
if [[ ! -f "$vga_bios" ]]; then
  echo "QEMU's standard VGA BIOS was not found: $vga_bios" >&2
  exit 69
fi
mkdir -p "$artifact_dir/pc-bios"
cp "$vga_bios" "$artifact_dir/pc-bios/vgabios-stdvga.bin"
(
  cd "$artifact_dir"
  sha256sum qemu-system-i386.js qemu-system-i386.wasm config-host.mak pc-bios/vgabios-stdvga.bin > SHA256SUMS
)
