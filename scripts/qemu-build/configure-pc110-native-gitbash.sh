#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <native-pc110-source-dir> <native-pc110-build-dir>" >&2
  exit 64
fi

source_dir=$(cd "$1" && pwd -P)
build_dir_parent=$(cd "$(dirname "$2")" && pwd -P)
build_dir="$build_dir_parent/$(basename "$2")"
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/.." && pwd)
bootstrap_wheels_dir="${PC110_WEB_QEMU_BOOTSTRAP_WHEELS:-$project_root/.cache/wasm-deps-t3/qemu-bootstrap-wheels}"
host_cc="${PC110_WEB_HOST_CC:-gcc}"
python_real="${PC110_WEB_NATIVE_PYTHON:-/c/PROGRA~1/Python313/python.exe}"

if [[ ! -x "$source_dir/configure" || ! -d "$source_dir/.git" ]]; then
  echo "Native PC110 QEMU source was not found: $source_dir" >&2
  exit 65
fi
if [[ -e "$build_dir" ]]; then
  echo "Native PC110 build directory must not already exist: $build_dir" >&2
  exit 66
fi
if ! command -v "$host_cc" >/dev/null 2>&1 || [[ ! -x "$python_real" ]]; then
  echo "A native compiler and short-path Python executable are required" >&2
  exit 67
fi

for wheel in setuptools-84.0.0-py3-none-any.whl wheel-0.48.0-py3-none-any.whl packaging-26.3-py3-none-any.whl; do
  if [[ ! -f "$bootstrap_wheels_dir/$wheel" ]]; then
    echo "Required offline wheel was not found: $bootstrap_wheels_dir/$wheel" >&2
    exit 68
  fi
  cp "$bootstrap_wheels_dir/$wheel" "$source_dir/python/wheels/"
done

mkdir -p "$build_dir"
python_wrapper="$build_dir/python3-posix"
cat > "$python_wrapper" <<EOF
#!/usr/bin/env bash
set -euo pipefail
real_python="$python_real"
if [[ "\$*" == *"mkvenv.py create"* ]]; then
  venv_windows="\$("\$real_python" "\$@")"
  venv_posix="\$(cygpath -u "\$venv_windows")"
  venv_meson="\$(cygpath -m "\$venv_windows")"
  venv_root="\$(dirname "\$(dirname "\$venv_posix")")"
  mkdir -p "\$venv_root/bin"
  cat > "\$venv_root/bin/meson" <<'MESON_WRAPPER'
#!/usr/bin/env bash
exec "\$(dirname "\$0")/../Scripts/meson.exe" "\$@"
MESON_WRAPPER
  chmod +x "\$venv_root/bin/meson"
  printf '%s\n' "\$venv_meson"
else
  exec "\$real_python" "\$@"
fi
EOF
chmod +x "$python_wrapper"

pushd "$build_dir" >/dev/null
/bin/bash "$source_dir/configure" \
  --python="$python_wrapper" \
  --cc="$host_cc" \
  --host-cc="$host_cc" \
  --target-list=i386-softmmu \
  --disable-werror \
  --disable-download \
  --disable-docs \
  --disable-tools \
  --disable-gtk \
  --disable-opengl \
  --enable-vnc \
  --disable-curses \
  --disable-gnutls \
  --disable-nettle \
  --disable-gcrypt \
  --disable-curl \
  --disable-slirp \
  --disable-fuse-lseek
popd >/dev/null
