#!/usr/bin/env bash
set -euo pipefail

# The Windows execution route is the currently validated path.  Unix hosts use
# the same cache layout and source preparation contract, but their dependency
# adapter is intentionally stopped until its native build is verified.
stage=${1:?stage is required}
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/.." && pwd)
cache_dir=${PC110_WEB_CACHE_DIR:-"$project_root/.cache"}

if [[ "$(uname -s)" != MINGW* && "$(uname -s)" != MSYS* ]]; then
  echo "Linux/macOS bootstrap is prepared, but its QEMU dependency build has not yet been validated."
  echo "Refusing to claim cross-platform compilation support before a native host regression is recorded."
  exit 78
fi

source "$script_dir/gitbash-emsdk-env.sh"
if [[ -d /c/msys64/ucrt64/bin ]]; then
  export PATH="/c/msys64/ucrt64/bin:$PATH"
fi
qemu_git_dir="$cache_dir/qemu-git-$stage"
source_dir="$cache_dir/pc110-wasm-src-$stage"
build_dir="$cache_dir/pc110-wasm-build-$stage"
record_dir="$cache_dir/pc110-wasm-record-$stage"
artifact_dir=${PC110_WEB_ARTIFACT_DIR:-"$project_root/artifacts/qemu-system-i386"}
deps_dir="$cache_dir/wasm-deps-$stage"
sysroot="$cache_dir/wasm-sysroot-$stage"

if [[ ! -d "$qemu_git_dir/.git" ]]; then
  git clone --depth 1 --branch v11.0.2 https://gitlab.com/qemu-project/qemu.git "$qemu_git_dir"
fi
if [[ ! -f "$qemu_git_dir/subprojects/keycodemapdb/README" ]]; then
  git clone https://gitlab.com/qemu-project/keycodemapdb.git "$qemu_git_dir/subprojects/keycodemapdb"
  git -C "$qemu_git_dir/subprojects/keycodemapdb" checkout --detach f5772a62ec52591ff6870b7e8ef32482371f22c6
fi
pc110_qemu_dir="${PC110_WEB_PC110_QEMU_DIR:-$cache_dir/pc110-qemu-src}"
pc110_qemu_revision=$(sed -n 's/.*"revision": "\([^"]*\)".*/\1/p' "$project_root/pc110-qemu.lock.json")
if [[ -z "$pc110_qemu_revision" ]]; then
  echo "PC110-QEMU dependency lock does not declare a revision" >&2
  exit 79
fi
if [[ ! -d "$pc110_qemu_dir/.git" ]]; then
  git clone --no-checkout https://github.com/cshaxu/pc110-qemu.git "$pc110_qemu_dir"
  git -C "$pc110_qemu_dir" checkout --detach "$pc110_qemu_revision"
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
