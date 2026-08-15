#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <qemu-source-dir> <qemu-build-dir> <record-dir>" >&2
  exit 64
fi

qemu_source_dir=$1
qemu_build_dir=$2
record_dir=$3
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/.." && pwd)

if [[ ! -x "$qemu_source_dir/configure" ]]; then
  echo "QEMU configure script was not found at $qemu_source_dir/configure" >&2
  exit 65
fi

if [[ ! -f "$qemu_source_dir/subprojects/keycodemapdb/README" ]]; then
  echo "the pinned keycodemapdb QEMU subproject must be prepared locally before configuration" >&2
  exit 66
fi

qemu_source_dir=$(cd "$qemu_source_dir" && pwd)
qemu_build_dir="$(cd "$(dirname "$qemu_build_dir")" && pwd)/$(basename "$qemu_build_dir")"
record_dir="$(cd "$(dirname "$record_dir")" && pwd)/$(basename "$record_dir")"

qemu_patches=(
  "$project_root/qemu-patches/0001-emscripten-skip-symlink-install-tree.patch"
  "$project_root/qemu-patches/0002-emscripten-use-predefined-cacheflush-guard.patch"
  "$project_root/qemu-patches/0003-emscripten-guard-posix-block-probes.patch"
  "$project_root/qemu-patches/0004-emscripten-propagate-compile-define.patch"
  "$project_root/qemu-patches/0005-emscripten-web-display.patch"
  "$project_root/qemu-patches/0006-emscripten-pump-event-proxies.patch"
)
for qemu_patch in "${qemu_patches[@]}"; do
  if git -C "$qemu_source_dir" apply --check "$qemu_patch"; then
    git -C "$qemu_source_dir" apply "$qemu_patch"
  elif ! git -C "$qemu_source_dir" apply --reverse --check "$qemu_patch"; then
    echo "a required Emscripten QEMU patch cannot be applied to this source revision" >&2
    exit 67
  fi
done

if [[ -e "$qemu_build_dir" || -e "$record_dir" ]]; then
  echo "build and record directories must not already exist" >&2
  exit 66
fi

source "$script_dir/gitbash-emsdk-env.sh"
# The adapter uses this flag only to validate Emscripten discovery.  QEMU's
# Meson configuration performs real target link probes and must not inherit it.
unset EMMAKEN_JUST_CONFIGURE

wasm_sysroot=${PC110_WEB_WASM_SYSROOT:-}
dependency_work_dir=${PC110_WEB_WASM_DEPENDENCY_WORK_DIR:-}
if [[ -z "$wasm_sysroot" || -z "$dependency_work_dir" ]]; then
  echo "PC110_WEB_WASM_SYSROOT and PC110_WEB_WASM_DEPENDENCY_WORK_DIR are required" >&2
  exit 68
fi

pkgconfig_cmd="$dependency_work_dir/tools/pkg-config.cmd"
ninja_bin="$dependency_work_dir/tools/ninja.exe"
if [[ ! -f "$wasm_sysroot/lib/libglib-2.0.a" || ! -x "$ninja_bin" || ! -f "$pkgconfig_cmd" ]]; then
  echo "the target sysroot, target pkg-config adapter, and local ninja are required" >&2
  exit 69
fi

export PATH="$dependency_work_dir/tools:$PATH"
ninja_windows=$(cygpath -m "$ninja_bin")
export AR=emar
export RANLIB=emranlib
export PKG_CONFIG="$(cygpath -w "$pkgconfig_cmd")"
export PKG_CONFIG_LIBDIR="$wasm_sysroot/lib/pkgconfig"
export PKG_CONFIG_PATH="$PKG_CONFIG_LIBDIR"
export PKG_CONFIG_SYSROOT_DIR="$wasm_sysroot"
export EM_PKG_CONFIG_PATH="$PKG_CONFIG_LIBDIR"
export CFLAGS="${CFLAGS:+$CFLAGS }-DEMSCRIPTEN"

host_cc=${PC110_WEB_HOST_CC:-gcc}
if [[ "$host_cc" == /* && -x "$host_cc" ]]; then
  # Meson executes native-tool paths from Windows Python, which cannot resolve
  # a Git-Bash-only path such as /c/msys64/ucrt64/bin/gcc.exe.
  host_cc=$(cygpath -m "$host_cc")
fi
if ! command -v "$host_cc" >/dev/null 2>&1; then
  echo "a native Windows host C compiler is required; set PC110_WEB_HOST_CC" >&2
  exit 70
fi

bootstrap_wheels_dir=${PC110_WEB_QEMU_BOOTSTRAP_WHEELS:-"$dependency_work_dir/qemu-bootstrap-wheels"}
setuptools_wheel="setuptools-84.0.0-py3-none-any.whl"
wheel_wheel="wheel-0.48.0-py3-none-any.whl"
packaging_wheel="packaging-26.3-py3-none-any.whl"
mkdir -p "$bootstrap_wheels_dir"
if [[ ! -f "$bootstrap_wheels_dir/$setuptools_wheel" ]]; then
  curl --fail --location --retry 3 --output "$bootstrap_wheels_dir/$setuptools_wheel" \
    "https://files.pythonhosted.org/packages/95/9c/c510029fc6ef33a6275cd2c5d3cecd6613dfd6aa401d57c54f1c18852ccf/$setuptools_wheel"
fi
if [[ ! -f "$bootstrap_wheels_dir/$wheel_wheel" ]]; then
  curl --fail --location --retry 3 --output "$bootstrap_wheels_dir/$wheel_wheel" \
    "https://files.pythonhosted.org/packages/2e/29/69cfbb602cd91690c55d38ba9fe53e6a7e76a6fa647bf38f19c138d25449/$wheel_wheel"
fi
if [[ ! -f "$bootstrap_wheels_dir/$packaging_wheel" ]]; then
  curl --fail --location --retry 3 --output "$bootstrap_wheels_dir/$packaging_wheel" \
    "https://files.pythonhosted.org/packages/63/34/ba1c580383c9eada3711951fef0795c80b829a078d72188184bcab9dd527/$packaging_wheel"
fi
printf '%s  %s\n' \
  '51a52592b3b99e102b609654876bd65f19f999935166d1352678931132b0c670' "$bootstrap_wheels_dir/$setuptools_wheel" \
  '3217dcc807155e45db462d7ef2431f5ddda0d7273b700d05a67b271ceb1287ab' "$bootstrap_wheels_dir/$wheel_wheel" \
  'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c' "$bootstrap_wheels_dir/$packaging_wheel" \
  | sha256sum -c -

# QEMU's venv helper prints sys.executable. Use a drive-qualified path with
# forward slashes: Git Bash can execute it, and Windows Meson can later reuse
# it from config-host.mak for custom targets.
python_wrapper="$qemu_build_dir/python3-posix"
mkdir -p "$qemu_build_dir"
cat > "$python_wrapper" <<EOF
#!/usr/bin/env bash
set -euo pipefail
real_python="$project_root/.cache/gitbash-bin/python3"
bootstrap_wheels_dir="$bootstrap_wheels_dir"
qemu_python_dir="$qemu_source_dir/python"
qemu_qmp_wheel="$qemu_source_dir/python/wheels/qemu_qmp-0.0.5-py3-none-any.whl"
if [[ "\$*" == *"mkvenv.py create"* ]]; then
  venv_windows="\$("\$real_python" "\$@")"
  venv_python="\$(cygpath -m "\$venv_windows")"
  "\$venv_python" -m pip install --no-index --find-links "\$bootstrap_wheels_dir" \
    "\$bootstrap_wheels_dir/$setuptools_wheel" "\$bootstrap_wheels_dir/$wheel_wheel" "\$bootstrap_wheels_dir/$packaging_wheel" "\$qemu_qmp_wheel" >&2
  "\$venv_python" -m pip install --no-build-isolation "\$qemu_python_dir" >&2
  printf '%s\n' "\$venv_python"
else
  exec "\$real_python" "\$@"
fi
EOF
chmod +x "$python_wrapper"

mkdir -p "$qemu_build_dir" "$record_dir"
git -C "$qemu_source_dir" rev-parse HEAD > "$record_dir/qemu-revision.txt"
emcc --version > "$record_dir/emscripten-version.txt"
"$dependency_work_dir/tools/pkg-config" --modversion glib-2.0 > "$record_dir/glib-pkgconfig-version.txt"
printf '%q ' "$0" "$@" > "$record_dir/configure-command.txt"
printf '\n' >> "$record_dir/configure-command.txt"

pushd "$qemu_build_dir" >/dev/null
/bin/bash "$qemu_source_dir/configure" \
  --cc=emcc \
  --host-cc="$host_cc" \
  --python="$python_wrapper" \
  --ninja="$ninja_windows" \
  --extra-cflags=-DEMSCRIPTEN \
  --cpu=wasm64 \
  --enable-tcg-interpreter \
  --target-list=i386-softmmu \
  --disable-download \
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
  --disable-fdt \
  --disable-fuse-lseek
popd >/dev/null

for required_file in config-host.mak config.status; do
  if [[ ! -f "$qemu_build_dir/$required_file" ]]; then
    echo "QEMU configuration did not produce $required_file" >&2
    exit 67
  fi
done

cp "$qemu_build_dir/config-host.mak" "$record_dir/config-host.mak"
cp "$qemu_build_dir/config.log" "$record_dir/config.log"
