# Release requirements

Build and test the product in its private source owner. Transfer only accepted
binary archives and reviewed public metadata into this repository's Releases.
Do not upload private source, Git history, build credentials, internal receipts
or temporary runner artifacts.

A release is identified by an immutable version tag. Its public tag must not
contain the private source tree. The product archive includes the CLI, Graph,
Admission and Semantic owner images, Console, generated protocol and complete
applicable licensing information. Partial Rust candidates are not publishable.

Prepare all assets in a draft, verify them together, then publish the complete
stable release and designate it latest. Keep released bytes unchanged; fixes
receive a new version. Prerelease builds must not replace the stable channel.

Assets for the initial Linux x86_64 target:

- hatter-linux-x86_64.tar.gz
- release-manifest.json
- SHA256SUMS

The manifest records the version, target, archive name/size/SHA256, public
corresponding-source references, license locations and verifiable build
provenance. Private identifiers or URLs are included only after explicit public
metadata review. Keep detailed internal build evidence in the private owner.

Use latest links for discovery and version-specific links for each download
transaction. Do not fetch a checksum using latest after selecting an archive.
No cross-repository credential is stored or publication workflow run here.
