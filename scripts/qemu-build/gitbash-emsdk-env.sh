#!/usr/bin/env bash
set -euo pipefail

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "source this file from Git Bash; do not execute it directly" >&2
  exit 64
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)
cache_dir=${PC110_WEB_CACHE_DIR:-"$project_root/.cache"}
emsdk_dir=${PC110_WEB_EMSDK_DIR:-"$cache_dir/emsdk"}
default_host_python=/c/PROGRA~1/Python313/python.exe
if [[ ! -x "$default_host_python" ]]; then
  default_host_python=$(command -v python || true)
fi
host_python=${PC110_WEB_HOST_PYTHON:-"$default_host_python"}
shim_dir="$cache_dir/gitbash-bin"

if [[ -z "$host_python" || ! -x "$host_python" ]]; then
  echo "a Windows Python executable is required; set PC110_WEB_HOST_PYTHON if python is not on PATH" >&2
  return 65
fi

if [[ ! -f "$emsdk_dir/emsdk_env.sh" ]]; then
  echo "Emscripten SDK was not found at $emsdk_dir" >&2
  return 66
fi

mkdir -p "$shim_dir"
{
  printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail'
  printf 'host_python=%q\n' "$host_python"
  cat <<'EOF'
"$host_python" "$@"
status=$?

args=("$@")
for index in "${!args[@]}"; do
  if [[ "${args[$index]}" == */mkvenv.py && "${args[$((index + 1))]:-}" == "create" ]]; then
    venv_dir=${args[$((index + 2))]:-}
    if [[ $status -eq 0 && -n "$venv_dir" ]]; then
      mkdir -p "$venv_dir/bin"
      for tool in python python3 meson; do
        cat > "$venv_dir/bin/$tool" <<EOF_TOOL
#!/usr/bin/env bash
script_dir=\$(cd "\$(dirname "\$0")" && pwd)
exec "\$script_dir/../Scripts/${tool}.exe" "\$@"
EOF_TOOL
        chmod +x "$venv_dir/bin/$tool"
      done
    fi
    break
  fi
done

exit "$status"
EOF
} > "$shim_dir/python3"
chmod +x "$shim_dir/python3"

export PATH="$shim_dir:$PATH"
source "$emsdk_dir/emsdk_env.sh" >/dev/null
export EM_CONFIG="$(cygpath -w "$emsdk_dir/.emscripten")"
export EMMAKEN_JUST_CONFIGURE=1

command -v emcc >/dev/null
emcc --version >/dev/null
