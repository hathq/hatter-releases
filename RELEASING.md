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

The committed public version record binds the outer archive size/SHA256, tested
platform/runtime, component source identities and exact acceptance scope. The
product manifest binds inner component/protocol/license digests; corresponding
source and license locations are recorded inside the archive. An archive cannot
include its own final hash in its inner manifest. Private identifiers or URLs are included only after explicit public
metadata review. Keep detailed internal build evidence in the private owner.

Use latest links for discovery and version-specific links for each download
transaction. Do not fetch a checksum using latest after selecting an archive.
No cross-repository credential is stored here. A protected manual publisher verifies
only this repository's draft assets against a committed version record and
publishes the same bytes. It never builds or runs private product code. Its
GitHub Release promotion is not a claim that this public repository built the
private product. Private acceptance remains in the product owner.

The publisher stays disabled until its version-tag protection and `binary-public`
review Environment are accepted. A version record in `versions/vX.Y.Z.json`
binds the three exact asset names, sizes and SHA256 values. The tag points to the
reviewed public publisher/record snapshot, not a private source commit.
Private runtime logs and acceptance receipts must not be attached publicly.
