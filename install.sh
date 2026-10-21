#!/bin/bash
# Copyright 2026 HAT Inc. SPDX-License-Identifier: MIT
# Version-bound user installation. No source builds, services, credentials or state initialization.
set -euo pipefail
umask 077
fail() { printf '%s\n' "$*" >&2; exit 1; }
mode=${1:-install}
[[ $# -le 1 && "$mode" =~ ^(install|--yes|--check|--help)$ ]] || fail 'Use --check, --yes or --help.'
if [[ "$mode" == --help ]]; then
  echo 'Hatter 0.10.0: Linux/WSL x86_64 GNU, existing secure Node 22/24, user-only install.'
  echo '--check verifies download and setup without installing. --yes accepts the printed installation plan.'
  exit 0
fi
unset NODE_OPTIONS NODE_PATH ENV BASH_ENV LD_PRELOAD LD_LIBRARY_PATH CDPATH
node=$(command -v node) || fail 'Install trusted Node 22 or 24 first.'
PATH=/usr/bin:/bin
export PATH
for tool in curl tar sha256sum timeout realpath stat df mktemp flock; do command -v "$tool" >/dev/null || fail "Required: $tool"; done
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || fail 'Only Linux/WSL x86_64 is supported.'
[[ $(id -u) != 0 ]] || fail 'Run as your ordinary user, without sudo.'
node=$(realpath -e -- "$node")
[[ -f "$node" && -x "$node" && $((0$(stat -c %a -- "$node") & 022)) == 0 ]] || fail 'Unsafe Node executable.'
[[ $(stat -c %u -- "$node") == 0 || $(stat -c %u -- "$node") == $(id -u) ]] || fail 'Untrusted Node owner.'
# The same bound check is installed in the launcher; a major number is not a security floor.
check_node_version() {
  local observed major minor patch
  observed=$(/usr/bin/timeout -k 2 5 "$1" --version) || return 1
  [[ "$observed" =~ ^v(22|24)\.([0-9]{1,3})\.([0-9]{1,3})$ ]] || return 1
  major=${BASH_REMATCH[1]}; minor=$((10#${BASH_REMATCH[2]})); patch=$((10#${BASH_REMATCH[3]}))
  (( major == 22 && (minor > 23 || minor == 23 && patch >= 4) || major == 24 && (minor > 22 || minor == 22 && patch >= 1) ))
}
check_node_version "$node" || fail 'Use Node 22.23.4+ or 24.22.1+ from the supported release line.'
[[ ${HOME:-} == /* && "$HOME" != / && "$HOME" != *$'\n'* ]] || fail 'An absolute HOME is required.'
[[ $(realpath -e -- "$HOME") == "$HOME" ]] || fail 'HOME must be a canonical directory.'
version=0.10.0
base="$HOME/.local/share/hatter"
target="$base/releases/$version"
launcher="$HOME/.local/bin/hatter"
secure_path() {
  local item="$1" owner
  while [[ "$item" != "$HOME" ]]; do
    [[ ! -L "$item" ]] || fail "Refusing symlink: $item"
    if [[ -e "$item" ]]; then
      [[ -d "$item" ]] || fail "Not a directory: $item"
      owner=$(stat -c %u -- "$item")
      [[ "$owner" == "$(id -u)" ]] || fail "Wrong directory owner: $item"
      [[ $((0$(stat -c %a -- "$item") & 022)) == 0 ]] || fail "Writable shared directory: $item"
    fi
    item=$(dirname -- "$item")
  done
  [[ $(stat -c %u -- "$HOME") == "$(id -u)" && $((0$(stat -c %a -- "$HOME") & 022)) == 0 ]] || fail 'Unsafe HOME permissions.'
}
secure_path "$base/releases"
secure_path "$(dirname -- "$launcher")"
[[ ! -e "$target" && ! -L "$target" ]] || fail 'This version already exists. Keep it for rollback; no overwrite performed.'
[[ ! -e "$launcher" && ! -L "$launcher" ]] || fail 'An existing hatter command is present; no replacement performed.'
[[ $(df -Pk -- "$HOME" | awk 'NR==2 {print $4}') -ge 1048576 ]] || fail 'At least 1 GiB free space is required.'
printf 'Hatter %s\nProduct: %s\nCommand: %s\nExisting Node: %s\nNo services, shell settings or user data will be changed.\n' "$version" "$target" "$launcher" "$node"
if [[ "$mode" == install ]]; then
  read -r -p 'Install this version? Type install: ' answer </dev/tty || fail 'No terminal; use --check or explicitly --yes.'
  [[ "$answer" == install ]] || fail 'Cancelled; nothing installed.'
fi
tmp=$(mktemp -d)
stage=''
cleanup() { rm -rf -- "$tmp"; [[ -z "$stage" ]] || rm -rf -- "$stage"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
url="https://github.com/hathq/hatter-releases/releases/download/v$version/hatter-linux-x86_64.tar.gz"
curl -q --fail --show-error --silent --location --proto '=https' --proto-redir '=https' --noproxy '*' --connect-timeout 10 --max-time 120 --max-filesize 30094055 --output "$tmp/product.tar.gz" "$url"
[[ $(stat -c %s -- "$tmp/product.tar.gz") == 30094055 ]] || fail 'Incomplete archive.'
printf '%s  %s\n' '9a2a4ba6f87d90dff39521d1bf8ba79880cb02efa1036752d896689a09b0a2c2' "$tmp/product.tar.gz" | sha256sum --check --status || fail 'Archive hash mismatch.'
mkdir "$tmp/product"
timeout -k 5 30 tar --extract --gzip --no-same-owner --no-same-permissions --file "$tmp/product.tar.gz" --directory "$tmp/product"
# Only the exact accepted archive can reach setup; setup --check does not start the product or create state.
HOME="$HOME" HATTER_CONSOLE_NODE_EXECUTABLE="$node" timeout -k 5 30 "$tmp/product/bin/hatter-setup" --check
if [[ "$mode" == --check ]]; then echo 'Download and setup verified; nothing installed or initialized.'; exit 0; fi
mkdir -p -- "$base/releases" "$(dirname -- "$launcher")"
secure_path "$base/releases"
secure_path "$(dirname -- "$launcher")"
[[ ! -L "$base/.install.lock" ]] || fail 'Unsafe lock path.'
exec 9>"$base/.install.lock"
flock -n 9 || fail 'Another installer is running.'
[[ ! -e "$target" && ! -L "$target" && ! -e "$launcher" && ! -L "$launcher" ]] || fail 'Destination changed; refusing overwrite.'
stage=$(mktemp -d "$base/releases/.install.XXXXXXXX")
mv -- "$tmp/product" "$stage/product"
{
  printf '#!/bin/bash\n# Hatter managed launcher; product version %s\nset -euo pipefail\nunset NODE_OPTIONS NODE_PATH ENV BASH_ENV LD_PRELOAD LD_LIBRARY_PATH\n' "$version"
  printf 'export HATTER_CONSOLE_NODE_EXECUTABLE=%q\n' "$node"
  declare -f check_node_version
  printf 'check_node_version "$HATTER_CONSOLE_NODE_EXECUTABLE" || { echo "Node security update required: 22.23.4+ or 24.22.1+." >&2; exit 1; }\n'
  printf 'export HATTER_CONSOLE_EXECUTABLE=%q\n' "$target/bin/hatter-console"
  printf 'exec %q "$@"\n' "$target/bin/hatter"
} > "$stage/launcher"
chmod 700 "$stage/launcher"
mv -T -- "$stage/product" "$target"
# Hard-link creation is atomic and refuses existing commands. Retain the accepted version if activation fails.
ln -- "$stage/launcher" "$launcher"
printf 'Installed Hatter %s. Start with:\n%q\nUser state and credentials were not initialized.\n' "$version" "$launcher"
