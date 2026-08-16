#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <candidate-artifact-dir>" >&2
  exit 64
fi

variant=wasm64
artifact_dir=$1
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd -P)
cache_dir=${PC110_WEB_CACHE_DIR:-"$project_root/.cache"}

deps_dir="$cache_dir/wasm-deps-$variant"
sysroot_dir="$cache_dir/wasm-sysroot-$variant"
source_dir="$cache_dir/pc110-wasm-src-$variant"
build_dir="$cache_dir/pc110-wasm-build-$variant"
record_dir="$cache_dir/pc110-wasm-record-$variant"

artifact_parent=$(cd "$(dirname "$artifact_dir")" && pwd -P)
artifact_dir="$artifact_parent/$(basename "$artifact_dir")"
case "$artifact_dir" in
  "$cache_dir"/*) ;;
  *)
    echo "incremental candidate artifacts must remain below $cache_dir" >&2
    exit 66
    ;;
esac

if [[ ! -f "$source_dir/.pc110-qemu-base-revision" ]]; then
  echo "prepared $variant source is unavailable: $source_dir" >&2
  exit 67
fi
if [[ ! -f "$build_dir/build.ninja" || ! -f "$build_dir/config-host.mak" ]]; then
  echo "configured $variant QEMU build is unavailable: $build_dir" >&2
  exit 68
fi
if [[ ! -f "$record_dir/config-host.mak" ]]; then
  echo "configured $variant record is unavailable: $record_dir" >&2
  exit 69
fi
if [[ ! -f "$sysroot_dir/lib/libglib-2.0.a" || ! -x "$deps_dir/tools/ninja.exe" ]]; then
  echo "the isolated $variant dependency sysroot or Ninja is unavailable" >&2
  exit 70
fi
if [[ -e "$artifact_dir" ]]; then
  echo "candidate artifact directory must not already exist: $artifact_dir" >&2
  exit 71
fi

mkdir -p "$record_dir"
printf 'variant=%s\nsource=%s\nbuild=%s\nsysroot=%s\nartifact=%s\n' \
  "$variant" "$source_dir" "$build_dir" "$sysroot_dir" "$artifact_dir" \
  > "$record_dir/incremental-artifact-command.txt"

PC110_WEB_WASM_VARIANT="$variant" PC110_WEB_WASM_DEPENDENCY_WORK_DIR="$deps_dir" \
  "$script_dir/build-configured-qemu-wasm-gitbash.sh" "$build_dir" "$artifact_dir"