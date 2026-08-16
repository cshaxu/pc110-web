#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "usage: $0 <qemu-git-source-dir> <pc110-wasm-source-dir> [pc110-qemu-source-dir]" >&2
  exit 64
fi

qemu_git_source_dir=$1
wasm_source_dir=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)
cache_dir=${PC110_WEB_CACHE_DIR:-"$project_root/.cache"}
pc110_qemu_dir=${3:-${PC110_WEB_PC110_QEMU_DIR:-"$cache_dir/pc110-qemu-src"}}

if [[ ! -d "$qemu_git_source_dir/.git" ]]; then
  echo "QEMU Git source was not found: $qemu_git_source_dir" >&2
  exit 65
fi
if [[ -e "$wasm_source_dir" ]]; then
  echo "PC110 WASM source destination must not already exist: $wasm_source_dir" >&2
  exit 66
fi
if [[ ! -f "$pc110_qemu_dir/qemu/hw-misc/pc110-fontrom.c" || \
      ! -f "$pc110_qemu_dir/qemu/target-i386/pc110post.c" ]]; then
  echo "The fork's PC110 source inputs are unavailable" >&2
  exit 67
fi

qemu_git_source_dir=$(cd "$qemu_git_source_dir" && pwd -P)
wasm_source_parent=$(cd "$(dirname "$wasm_source_dir")" && pwd -P)
wasm_source_dir="$wasm_source_parent/$(basename "$wasm_source_dir")"

git clone --quiet --no-hardlinks "$qemu_git_source_dir" "$wasm_source_dir"
git -C "$wasm_source_dir" checkout --quiet --detach "$(git -C "$qemu_git_source_dir" rev-parse HEAD)"

mkdir -p "$wasm_source_dir/subprojects"
cp -a "$qemu_git_source_dir/subprojects/keycodemapdb" "$wasm_source_dir/subprojects/keycodemapdb"
cp "$pc110_qemu_dir/qemu/hw-misc/pc110-fontrom.c" "$wasm_source_dir/hw/misc/"
cp "$pc110_qemu_dir/qemu/hw-misc/pc110-chipset.c" "$wasm_source_dir/hw/misc/"
cp "$pc110_qemu_dir/qemu/target-i386/pc110post.c" "$wasm_source_dir/target/i386/"

for device_source in pc110-fontrom pc110-chipset; do
  if ! grep -q "$device_source.c" "$wasm_source_dir/hw/misc/meson.build"; then
    printf "system_ss.add(when: 'CONFIG_ISA_BUS', if_true: files('%s.c'))\n" "$device_source" \
      >> "$wasm_source_dir/hw/misc/meson.build"
  fi
done

for patch_file in "$pc110_qemu_dir"/qemu/patches/*.patch; do
  git -C "$wasm_source_dir" apply --check "$patch_file"
  git -C "$wasm_source_dir" apply "$patch_file"
done

for patch_file in "$project_root"/qemu/patches/*.patch; do
  git -C "$wasm_source_dir" apply --check "$patch_file"
  git -C "$wasm_source_dir" apply "$patch_file"
done

printf '%s\n' "$(git -C "$wasm_source_dir" rev-parse HEAD)" > "$wasm_source_dir/.pc110-qemu-base-revision"
printf '%s\n' "Prepared PC110 WASM QEMU source at $wasm_source_dir"
