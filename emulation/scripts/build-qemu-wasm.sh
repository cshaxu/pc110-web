#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <qemu-source-dir> <qemu-build-dir> <artifact-dir>" >&2
  exit 64
fi

qemu_source_dir=$1
qemu_build_dir=$2
artifact_dir=$3
qemu_repository=https://gitlab.com/qemu-project/qemu.git
qemu_tag=v11.0.2

if [[ -e "$qemu_source_dir" || -e "$qemu_build_dir" ]]; then
  echo "source and build directories must not already exist" >&2
  exit 65
fi

mkdir -p "$artifact_dir"

git clone --depth 1 --branch "$qemu_tag" "$qemu_repository" "$qemu_source_dir"
git -C "$qemu_source_dir" rev-parse HEAD > "$artifact_dir/qemu-revision.txt"
emcc --version > "$artifact_dir/emscripten-version.txt"

mkdir -p "$qemu_build_dir"
pushd "$qemu_build_dir" >/dev/null
emconfigure "$qemu_source_dir/configure" \
  --python="$(command -v python3)" \
  --extra-cflags=-DEMSCRIPTEN \
  --cpu=wasm64 \
  --enable-tcg-interpreter \
  --target-list=i386-softmmu \
  --disable-docs \
  --disable-tools \
  --disable-gtk \
  --disable-sdl \
  --disable-opengl \
  --disable-vnc \
  --disable-curses \
  --disable-gnutls \
  --disable-nettle \
  --disable-gcrypt \
  --disable-curl \
  --disable-slirp \
  --disable-fuse-lseek
emmake make -j"$(nproc)"
popd >/dev/null

mapfile -t build_outputs < <(
  find "$qemu_build_dir" -maxdepth 3 -type f \( \
    -name 'qemu-system-i386*' -o \
    -name '*.wasm' -o \
    -name '*.js' \
  \) -print
)

if [[ ${#build_outputs[@]} -eq 0 ]]; then
  echo "no QEMU browser outputs were found" >&2
  exit 66
fi

for output in "${build_outputs[@]}"; do
  relative_path=${output#"$qemu_build_dir"/}
  install -D -m 0644 "$output" "$artifact_dir/$relative_path"
done

cp "$qemu_build_dir/config-host.mak" "$artifact_dir/config-host.mak"
(
  cd "$artifact_dir"
  find . -type f -print0 | sort -z | xargs -0 sha256sum
) > "$artifact_dir/SHA256SUMS"
