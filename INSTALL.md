# Portable setup

The current archive supports Linux x86_64 (GNU), tested on Ubuntu 24.04.
Use an existing Node 22 or 24 installation. Node, system services and shell
configuration are not installed or modified by this package.

Choose a release once from the [release page](https://github.com/hathq/hatter-releases/releases/latest).
Download the archive, release-manifest.json and SHA256SUMS from that exact version.
For example, the following selects version 0.10.0 explicitly:

```sh
mkdir -m 700 hatter-download-v0.10.0
cd hatter-download-v0.10.0
release=v0.10.0
base="https://github.com/hathq/hatter-releases/releases/download/$release"
for file in hatter-linux-x86_64.tar.gz release-manifest.json SHA256SUMS; do
  curl --fail --location --proto '=https' --tlsv1.2 --output "$file" "$base/$file"
done
sha256sum --check SHA256SUMS
```

Stop if a download or checksum check fails. The checksums bind the publisher's
files; they are not an independent product-signing certificate. Signed HAT
catalog trust is a separate concern and must never be inferred from these hashes.

After successful verification, extract into a new private directory:

```sh
mkdir -m 700 product
tar --no-same-owner -xzf hatter-linux-x86_64.tar.gz -C product
cd product
export HATTER_CONSOLE_NODE_EXECUTABLE="$(realpath "$(command -v node)")"
export HATTER_CONSOLE_EXECUTABLE="$PWD/bin/hatter-console"
bin/hatter-setup --check
```

The selected Node executable must be a canonical regular file owned by you or
root, without group/other write permissions. If refused, use a trusted Node
installation rather than disabling ownership checks or modifying a shared cache.

Check mode verifies the complete generation without creating state. To explicitly
prepare only the state directory, run `bin/hatter-setup --prepare-state`.
The default is `~/.hatter/agent`; `HATTER_HOME` may select a different private
absolute directory. Setup never creates product data, a Role, a Grant or a HAT,
and never adopts `~/.codex` or the `~/.hatter` root.

Start with `bin/hatter` in this shell. Open the local URL it displays in your
browser. A fresh store remains Missing until you explicitly prepare its owner
storage. Semantic definitions, account credentials and HAT/action permissions
are separate explicit choices; they are not seeded by extraction or setup.

## Acceptance and limitations

This version passed portable setup and real isolated browser/CLI journeys on
Node 22.23.3 and 24.15.0, including catalog display, altered-input refusal and
cleanup of all five child processes. These are development tests, not proof of
live Registry synchronization, semantic bootstrap, external HAT effects or every
workflow. Follow the owner issues for those remaining acceptance gates.

Keep the previously accepted directory for rollback. Select a new release in a
new directory; do not mix component versions or modify an accepted generation.
Do not replace user state as part of a binary update.

Read `licenses/hatter-distribution/components.json` for exact license scope,
original notices and the bundled corresponding source of MPL-covered components.
Free use and separately contracted support do not replace third-party rights.
