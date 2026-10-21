# Hatter releases

Public binary distribution for Hatter. Product source is maintained privately
by HAT Inc. This repository contains distribution information, not the private
product source or its history.

## Availability

Hatter 0.10.0 is available for Linux x86_64 (GNU), tested on Ubuntu 24.04 with
Node 22 and 24. The archive includes the CLI, owner processes, Console and
a version-bound shell installer. Node is installed separately. See the [setup guide](INSTALL.md)
and each release's explicit validation scope; other platforms and live Registry
synchronization are separate acceptance.

## Install

Copy the verified installation command from the [product site](https://hatter.ihat.online/download).
It displays the exact stable version and requirements. Review and confirm the
local installation plan; no administrator privileges are used.

## Manual downloads

- [Latest stable release](https://github.com/hathq/hatter-releases/releases/latest)
- [Linux x86_64 product archive](https://github.com/hathq/hatter-releases/releases/latest/download/hatter-linux-x86_64.tar.gz)
- [Release manifest](https://github.com/hathq/hatter-releases/releases/latest/download/release-manifest.json)
- [Checksums](https://github.com/hathq/hatter-releases/releases/latest/download/SHA256SUMS)

The asset names are stable across versions; the release tag and manifest record
the exact version. Only platforms with an accepted archive are supported.
See the release manifest for minimum operating-system and runtime requirements.

## Verification and source notices

When automating updates, resolve the latest release once and download its
manifest, checksums and archive from that exact version. Do not combine files
from multiple resolutions of latest. Verify bytes and applicable provenance
before installation; retaining a previously accepted version permits rollback.

Each product archive must include applicable binary usage terms and third-party
LICENSE/NOTICE files. MPL-covered sem-lang source, including distributed
modifications, is provided through the corresponding source reference recorded
in that release. Source rights are not conditional on paid support.

Product source confidentiality does not revoke upstream or third-party rights.
No repository-level license label overrides the terms included with a release.

[Binary use terms](BINARY-TERMS.md): use is free, redistribution of the expressly
identified HAT-owned portions requires separate permission, and support is
contracted separately. Upstream and third-party licenses retain their own scope.

## Product information

[Hatter product site](https://hatter.ihat.online/) ·
[HAT discovery](https://ihat.online/)

The verification scripts in this repository use MIT (see LICENSE). This does
not change any binary component license or the scope of BINARY-TERMS.md.
