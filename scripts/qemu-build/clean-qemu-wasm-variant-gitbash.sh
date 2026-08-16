#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <wasm32|wasm64> <candidate-artifact-dir>" >&2
  exit 64
fi

variant=$1
artifact_dir=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd -P)
cache_dir=${PC110_WEB_CACHE_DIR:-"$project_root/.cache"}

case "$variant" in
  wasm32|wasm64) ;;
  *)
    echo "unsupported WASM variant: $variant" >&2
    exit 65
    ;;
esac

artifact_parent=$(cd "$(dirname "$artifact_dir")" && pwd -P)
artifact_dir="$artifact_parent/$(basename "$artifact_dir")"
case "$artifact_dir" in
  "$cache_dir"/*) ;;
  *)
    echo "candidate artifacts must remain below $cache_dir" >&2
    exit 66
    ;;
esac

PC110_WEB_WASM_VARIANT="$variant" PC110_WEB_ARTIFACT_DIR="$artifact_dir" \
  "$script_dir/run-setup-build.sh" "$variant"
