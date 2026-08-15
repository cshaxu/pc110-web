#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <qemu-git-source-dir> <native-pc110-source-dir>" >&2
  exit 64
fi

qemu_git_source_dir=$1
native_source_dir=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)
cache_dir=${PC110_WEB_CACHE_DIR:-"$project_root/.cache"}
pc110_qemu_dir=${PC110_WEB_PC110_QEMU_DIR:-"$cache_dir/pc110-qemu-src"}

if [[ ! -d "$qemu_git_source_dir/.git" ]]; then
  echo "QEMU Git source was not found: $qemu_git_source_dir" >&2
  exit 65
fi
if [[ -e "$native_source_dir" ]]; then
  echo "Native PC110 source destination must not already exist: $native_source_dir" >&2
  exit 66
fi
if [[ ! -f "$pc110_qemu_dir/qemu/hw-misc/pc110-fontrom.c" || \
      ! -f "$pc110_qemu_dir/qemu/target-i386/pc110post.c" ]]; then
  echo "The fork's PC110 source inputs are unavailable" >&2
  exit 67
fi

git clone --no-hardlinks "$qemu_git_source_dir" "$native_source_dir"
git -C "$native_source_dir" checkout --detach "$(git -C "$qemu_git_source_dir" rev-parse HEAD)"

mkdir -p "$native_source_dir/subprojects"
cp -a "$qemu_git_source_dir/subprojects/keycodemapdb" "$native_source_dir/subprojects/keycodemapdb"
cp "$pc110_qemu_dir/qemu/hw-misc/pc110-fontrom.c" "$native_source_dir/hw/misc/"
cp "$pc110_qemu_dir/qemu/hw-misc/pc110-chipset.c" "$native_source_dir/hw/misc/"
cp "$pc110_qemu_dir/qemu/target-i386/pc110post.c" "$native_source_dir/target/i386/"

for device_source in pc110-fontrom pc110-chipset; do
  if ! grep -q "$device_source.c" "$native_source_dir/hw/misc/meson.build"; then
    printf "system_ss.add(when: 'CONFIG_ISA_BUS', if_true: files('%s.c'))\n" "$device_source" \
      >> "$native_source_dir/hw/misc/meson.build"
  fi
done

for patch_file in "$pc110_qemu_dir"/qemu/patches/*.patch; do
  if git -C "$native_source_dir" apply --check "$patch_file"; then
    git -C "$native_source_dir" apply "$patch_file"
  else
    echo "PC110 patch does not apply: $patch_file" >&2
    exit 68
  fi
done

staging_patch="$project_root/qemu/patches/0001-emscripten-skip-symlink-install-tree.patch"
if git -C "$native_source_dir" apply --check "$staging_patch"; then
  git -C "$native_source_dir" apply "$staging_patch"
else
  echo "Windows staging patch does not apply: $staging_patch" >&2
  exit 69
fi

printf '%s\n' "$(git -C "$native_source_dir" rev-parse HEAD)" > "$native_source_dir/.pc110-qemu-base-revision"
printf '%s\n' "Prepared native PC110 QEMU source at $native_source_dir"
