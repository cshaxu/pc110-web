#!/usr/bin/env bash
set -euo pipefail

# The Windows execution route is the currently validated path.  Unix hosts use
# the same cache layout and source preparation contract, but their dependency
# adapter is intentionally stopped until its native build is verified.
stage=${1:?stage is required}
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/.." && pwd)
cache_dir="$project_root/.cache"

if [[ "$(uname -s)" != MINGW* && "$(uname -s)" != MSYS* ]]; then
  echo "Linux/macOS bootstrap is prepared, but its QEMU dependency build has not yet been validated."
  echo "Refusing to claim cross-platform compilation support before a native host regression is recorded."
  exit 78
fi

source "$script_dir/gitbash-emsdk-env.sh"
qemu_git_dir="$cache_dir/qemu-git-$stage"
source_dir="$cache_dir/pc110-wasm-src-$stage"
build_dir="$cache_dir/pc110-wasm-build-$stage"
record_dir="$cache_dir/pc110-wasm-record-$stage"
artifact_dir="$project_root/artifacts/qemu-system-i386"
deps_dir="$cache_dir/wasm-deps-$stage"
sysroot="$cache_dir/wasm-sysroot-$stage"

if [[ ! -d "$qemu_git_dir/.git" ]]; then
  git clone --depth 1 --branch v11.0.2 https://gitlab.com/qemu-project/qemu.git "$qemu_git_dir"
fi
pc110_qemu_dir="${PC110_WEB_PC110_QEMU_DIR:-$cache_dir/pc110-qemu-src}"
if [[ ! -d "$pc110_qemu_dir/.git" ]]; then
  git clone --no-checkout https://github.com/cshaxu/pc110-qemu.git "$pc110_qemu_dir"
  git -C "$pc110_qemu_dir" checkout --detach bae390e
fi
if [[ ! -d "$source_dir" ]]; then
  PC110_WEB_PC110_QEMU_DIR="$pc110_qemu_dir" "$script_dir/prepare-pc110-wasm-source-gitbash.sh" "$qemu_git_dir" "$source_dir"
fi
if [[ ! -d "$deps_dir" ]]; then
  "$script_dir/build-wasm-dependencies-gitbash.sh" "$deps_dir" "$sysroot"
fi
if [[ ! -d "$build_dir" ]]; then
  PC110_WEB_WASM_DEPENDENCY_WORK_DIR="$deps_dir" PC110_WEB_WASM_SYSROOT="$sysroot" \
    "$script_dir/configure-qemu-wasm-gitbash.sh" "$source_dir" "$build_dir" "$record_dir"
fi
if [[ ! -d "$artifact_dir" ]]; then
  PC110_WEB_WASM_DEPENDENCY_WORK_DIR="$deps_dir" \
    "$script_dir/build-configured-qemu-wasm-gitbash.sh" "$build_dir" "$artifact_dir"
fi
printf '%s\n' "Build complete: $artifact_dir"
