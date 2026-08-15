#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <dependency-work-dir> <target-sysroot>" >&2
  exit 64
fi

work_dir=$1
sysroot=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/.." && pwd)
pkgconf_bin=${PC110_WEB_PKGCONF:-/c/msys64/usr/bin/pkgconf.exe}
make_bin=${PC110_WEB_MAKE:-/c/msys64/usr/bin/make.exe}
ninja_version=1.12.1
zlib_version=1.3.1
libffi_version=3.5.2
pixman_version=0.44.2
pcre2_version=10.45
glib_version=2.84.0

if [[ -e "$work_dir" || -e "$sysroot" ]]; then
  echo "dependency work directory and target sysroot must not already exist" >&2
  exit 65
fi

if [[ ! -x "$pkgconf_bin" || ! -x "$make_bin" ]]; then
  echo "pkgconf and make executables are required; set PC110_WEB_PKGCONF and PC110_WEB_MAKE if needed" >&2
  exit 66
fi

source "$script_dir/gitbash-emsdk-env.sh"

host_python=${PC110_WEB_HOST_PYTHON:-"$(command -v python)"}
host_venv="$work_dir/host-venv"
tools_dir="$work_dir/tools"
sources_dir="$work_dir/sources"
builds_dir="$work_dir/builds"
downloads_dir="$work_dir/downloads"
manifest_dir="$work_dir/manifest"
mkdir -p "$tools_dir" "$sources_dir" "$builds_dir" "$downloads_dir" "$manifest_dir" "$sysroot/lib/pkgconfig"

# QEMU detects SDL through pkg-config. Emscripten supplies SDL2 as a link-time
# port rather than a sysroot package, so publish the narrow descriptor that
# maps QEMU's SDL dependency to that supported port.
cat > "$sysroot/lib/pkgconfig/sdl2.pc" <<EOF
prefix=$sysroot
includedir=\${prefix}/include

Name: SDL2
Description: Emscripten SDL2 port
Version: 2.32.10
Libs: -sUSE_SDL=2
Cflags: -sUSE_SDL=2
EOF

ninja_bin=${PC110_WEB_NINJA:-"$tools_dir/ninja.exe"}
if [[ -z "${PC110_WEB_NINJA:-}" ]]; then
  ninja_archive="$downloads_dir/ninja-win.zip"
  curl --fail --location --retry 3 --output "$ninja_archive" \
    "https://github.com/ninja-build/ninja/releases/download/v$ninja_version/ninja-win.zip"
  sha256sum "$ninja_archive" >> "$manifest_dir/SHA256SUMS"
  unzip -q "$ninja_archive" -d "$tools_dir"
fi

if [[ ! -x "$ninja_bin" ]]; then
  echo "a runnable ninja executable is required; set PC110_WEB_NINJA if needed" >&2
  exit 67
fi

"$host_python" -m venv "$host_venv"
"$host_venv/Scripts/python.exe" -m pip install --disable-pip-version-check "meson==1.5.0"
meson_bin="$host_venv/Scripts/meson.exe"
pkgconf_windows=$(cygpath -w "$pkgconf_bin")
pkgconf_adapter_windows=$(cygpath -w "$tools_dir/pkg-config.ps1")
pkgconf_cmd_windows=$(cygpath -w "$tools_dir/pkg-config.cmd")
ninja_windows=$(cygpath -w "$ninja_bin")
ninja_windows_slash=${ninja_windows//\\//}
sysroot_windows=$(cygpath -w "$sysroot")
sysroot_windows_slash=${sysroot_windows//\\//}
pkgconfig_windows=$(cygpath -w "$sysroot/lib/pkgconfig")

cat > "$tools_dir/pkg-config" <<EOF
#!/usr/bin/env bash
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$pkgconf_adapter_windows" "\$@"
EOF
chmod +x "$tools_dir/pkg-config"

cat > "$tools_dir/pkg-config.cmd" <<EOF
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$pkgconf_adapter_windows" %*
exit /b %ERRORLEVEL%
EOF

cat > "$tools_dir/pkg-config.ps1" <<EOF
param(
    [Parameter(ValueFromRemainingArguments = \$true)]
    [string[]]\$PkgconfArguments
)

\$ErrorActionPreference = 'Stop'
Remove-Item Env:MSYSTEM -ErrorAction SilentlyContinue
Remove-Item Env:MSYS2_PATH_TYPE -ErrorAction SilentlyContinue
\$env:PKG_CONFIG_LIBDIR = '$pkgconfig_windows'
\$env:PKG_CONFIG_PATH = '$pkgconfig_windows'
\$sysrootWindows = '$sysroot_windows'.Replace('\\', '/')
\$sysrootPosix = '/' + \$sysrootWindows.Substring(0, 1).ToLowerInvariant() + \$sysrootWindows.Substring(2)
Remove-Item Env:PKG_CONFIG_SYSROOT_DIR -ErrorAction SilentlyContinue
\$pkgconfOutput = & '$pkgconf_windows' @PkgconfArguments
\$pkgconfExitCode = \$LASTEXITCODE
if (\$sysrootWindows) {
    \$pkgconfOutput | ForEach-Object { \$_.Replace(\$sysrootPosix, \$sysrootWindows) }
} else {
    \$pkgconfOutput
}
exit \$pkgconfExitCode
EOF

cat > "$tools_dir/make" <<EOF
#!/usr/bin/env bash
exec "$make_bin" "\$@"
EOF
chmod +x "$tools_dir/make"

cat > "$work_dir/host-tools.native" <<EOF
[binaries]
ninja = '$ninja_windows_slash'
EOF

export PATH="$tools_dir:$PATH"
export PKG_CONFIG="$tools_dir/pkg-config"
export PKG_CONFIG_LIBDIR="$sysroot/lib/pkgconfig"
export PKG_CONFIG_PATH="$PKG_CONFIG_LIBDIR"
export PKG_CONFIG_SYSROOT_DIR="$sysroot"
export EM_PKG_CONFIG_PATH="$PKG_CONFIG_LIBDIR"
export CPATH="$sysroot/include"
export CC=emcc
export CXX=em++
export AR=emar
export RANLIB=emranlib
# libffi's Autoconf/libtool probe cannot consume the Windows path returned by
# `emcc -print-prog-name=ld` from Git Bash.  It only needs an Emscripten-aware
# linker facade for this static target build.
export LD=emcc
export NM=emnm
# Keep Autoconf's generated command pipelines free of the Git installation
# path, which contains a space on this Windows host.
export SED=sed
export GREP=grep
export EGREP=egrep
export FGREP=fgrep
export MKDIR_P='mkdir -p'
export CFLAGS='-O3 -m64 -sMEMORY64=1 -pthread -DWASM_BIGINT'
export CXXFLAGS="$CFLAGS"
export LDFLAGS="-m64 -sMEMORY64=1 -sWASM_BIGINT -sASYNCIFY=1 -pthread -L$sysroot/lib"

download_and_extract() {
  local name=$1
  local url=$2
  local destination=$3
  local archive="$downloads_dir/$name"
  curl --fail --location --retry 3 --output "$archive" "$url"
  sha256sum "$archive" >> "$manifest_dir/SHA256SUMS"
  mkdir -p "$destination"
  if [[ "$name" == glib-* ]]; then
    # GLib's COPYING is a source-tree symlink; Git Bash extraction can create
    # it before its target is available on Windows. It is not a build input.
    tar -xf "$archive" --exclude=COPYING --strip-components=1 -C "$destination"
  else
    tar -xf "$archive" --strip-components=1 -C "$destination"
  fi
}

download_and_extract "zlib-$zlib_version.tar.gz" \
  "https://zlib.net/fossils/zlib-$zlib_version.tar.gz" "$sources_dir/zlib"
pushd "$builds_dir" >/dev/null
mkdir zlib
pushd zlib >/dev/null
"$sources_dir/zlib/configure" --prefix="$sysroot" --static
"$make_bin" -j"$(nproc)"
"$make_bin" install
popd >/dev/null

download_and_extract "libffi-$libffi_version.tar.gz" \
  "https://github.com/libffi/libffi/releases/download/v$libffi_version/libffi-$libffi_version.tar.gz" "$sources_dir/libffi"
mkdir libffi
pushd libffi >/dev/null
"$sources_dir/libffi/configure" --host=wasm64-unknown-emscripten --prefix="$sysroot" \
  --enable-static --disable-shared --disable-dependency-tracking --disable-builddir \
  --disable-multi-os-directory --disable-raw-api --disable-docs
"$make_bin" -j"$(nproc)"
# libffi's generated man-page target is not portable to Git Bash. Install the
# target library, headers, and pkg-config metadata explicitly instead.
"$make_bin" install-exec-am
"$make_bin" install-pkgconfigDATA
"$make_bin" -C include install
popd >/dev/null

cat > "$work_dir/emscripten-wasm64.cross" <<EOF
[host_machine]
system = 'emscripten'
cpu_family = 'wasm64'
cpu = 'wasm64'
endian = 'little'

[binaries]
c = 'emcc'
cpp = 'em++'
ar = 'emar'
ranlib = 'emranlib'
pkgconfig = ['$pkgconf_cmd_windows', '--static']

[properties]
needs_exe_wrapper = true

[built-in options]
c_args = ['-O3', '-m64', '-sMEMORY64=1', '-pthread', '-DWASM_BIGINT']
cpp_args = ['-O3', '-m64', '-sMEMORY64=1', '-pthread', '-DWASM_BIGINT']
c_link_args = ['-m64', '-sMEMORY64=1', '-sWASM_BIGINT', '-sASYNCIFY=1', '-pthread', '-L$sysroot_windows_slash/lib']
cpp_link_args = ['-m64', '-sMEMORY64=1', '-sWASM_BIGINT', '-sASYNCIFY=1', '-pthread', '-L$sysroot_windows_slash/lib']
EOF

download_and_extract "pixman-$pixman_version.tar.gz" \
  "https://cairographics.org/releases/pixman-$pixman_version.tar.gz" "$sources_dir/pixman"
"$meson_bin" setup "$builds_dir/pixman" "$sources_dir/pixman" --prefix="$sysroot" \
  --native-file="$work_dir/host-tools.native" --cross-file="$work_dir/emscripten-wasm64.cross" --default-library=static --buildtype=release \
  -Dtests=disabled -Ddemos=disabled
"$meson_bin" install -C "$builds_dir/pixman"

mkdir "$builds_dir/resolver-stub"
cat > "$builds_dir/resolver-stub/res_query.c" <<'EOF'
#include <netdb.h>

int res_query(const char *name, int class, int type, unsigned char *dest, int len)
{
    h_errno = HOST_NOT_FOUND;
    return -1;
}
EOF
emcc $CFLAGS -c "$builds_dir/resolver-stub/res_query.c" -fPIC -o "$builds_dir/resolver-stub/libresolv.o"
emar rcs "$sysroot/lib/libresolv.a" "$builds_dir/resolver-stub/libresolv.o"

download_and_extract "pcre2-$pcre2_version.tar.bz2" \
  "https://github.com/PCRE2Project/pcre2/releases/download/pcre2-$pcre2_version/pcre2-$pcre2_version.tar.bz2" "$sources_dir/pcre2"
mkdir "$builds_dir/pcre2"
pushd "$builds_dir/pcre2" >/dev/null
# PCRE2's Autoconf executable-suffix probe invokes the linker. Asyncify is
# irrelevant to this static library and its optimizer cannot process wasm64
# probe outputs on this Windows-hosted Emscripten version.
pcre2_saved_ldflags=$LDFLAGS
export LDFLAGS="-m64 -sMEMORY64=1 -sWASM_BIGINT -pthread -L$sysroot/lib"
"$sources_dir/pcre2/configure" --host=wasm64-unknown-emscripten --prefix="$sysroot" \
  --enable-static --disable-shared --disable-dependency-tracking --disable-jit --enable-pcre2-8 --disable-pcre2-16 --disable-pcre2-32 \
  --disable-pcre2grep-libz --disable-pcre2test-libedit --disable-pcre2test-libreadline
"$make_bin" -j"$(nproc)"
# libtool on this Git-Bash/MSYS boundary installs only the .la descriptor for
# a static-only PCRE2 build and then fails on the optional POSIX wrapper. GLib
# requires the 8-bit static archive, headers, and pkg-config metadata only.
"$make_bin" install-includeHEADERS install-nodist_includeHEADERS install-pkgconfigDATA
"$sources_dir/pcre2/install-sh" -c "$builds_dir/pcre2/.libs/libpcre2-8.a" "$sysroot/lib/libpcre2-8.a"
export LDFLAGS=$pcre2_saved_ldflags
popd >/dev/null

download_and_extract "glib-$glib_version.tar.xz" \
  "https://download.gnome.org/sources/glib/2.84/glib-$glib_version.tar.xz" "$sources_dir/glib"
"$meson_bin" setup "$builds_dir/glib" "$sources_dir/glib" --prefix="$sysroot" \
  --native-file="$work_dir/host-tools.native" --cross-file="$work_dir/emscripten-wasm64.cross" --default-library=static --buildtype=release \
  -Dselinux=disabled -Dxattr=false -Dlibmount=disabled -Dnls=disabled \
  -Dtests=false -Dglib_debug=disabled -Dglib_assert=false -Dglib_checks=false
sed -i -E '/#define HAVE_POSIX_SPAWN 1/d' "$builds_dir/glib/config.h"
sed -i -E '/#define HAVE_PTHREAD_GETNAME_NP 1/d' "$builds_dir/glib/config.h"
"$meson_bin" install -C "$builds_dir/glib"

# Static dependencies need to propagate their pthread ABI requirement, but an
# Emscripten worker-pool size is an application-level browser runtime policy.
# Meson records its cross-file link arguments in these generated .pc files;
# remove the dependency-local pool setting so the final QEMU link controls it.
for pc_file in "$sysroot/lib/pkgconfig/glib-2.0.pc" "$sysroot/lib/pkgconfig/pixman-1.pc"; do
  sed -i 's/ -sPTHREAD_POOL_SIZE=[0-9]\+//g' "$pc_file"
done

printf '%s\n' "$zlib_version" > "$manifest_dir/zlib-version.txt"
printf '%s\n' "$libffi_version" > "$manifest_dir/libffi-version.txt"
printf '%s\n' "$pixman_version" > "$manifest_dir/pixman-version.txt"
printf '%s\n' "$pcre2_version" > "$manifest_dir/pcre2-version.txt"
printf '%s\n' "$ninja_version" > "$manifest_dir/ninja-version.txt"
printf '%s\n' "$glib_version" > "$manifest_dir/glib-version.txt"
emcc --version > "$manifest_dir/emscripten-version.txt"
"$PKG_CONFIG" --modversion glib-2.0 > "$manifest_dir/glib-pkgconfig-version.txt"
find "$sysroot" -type f -print0 | sort -z | xargs -0 sha256sum > "$manifest_dir/sysroot-SHA256SUMS"
