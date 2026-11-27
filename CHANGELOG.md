# Changelog

All notable changes to OWASP DecodeBox are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [0.3.0](https://github.com/m4sh-wacker/DecodeBox-SDK/compare/v0.2.0...v0.3.0) (2026-11-27)

### Added

- add client-side import/export for saved recipes ([`64a6947`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/64a6947c6deb7513b5d011b6ffc87e02e4d3c2c4))
- **sdk:** unify browser and GraalJS runtimes for static distribution ([`74b2b39`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/74b2b3920500925c6e221e4fbea5cd6aa82afa73))

### Fixed

- auto-expand newly created favorites and recent sections ([`26cc88d`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/26cc88d64dca1d864dd371c7606ad045c344e950))
- auto-expand newly created favorites and recent sections ([`7805925`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/7805925b543158fe65e4d5486a8b12849bddf431))
- enforce operation-aware import validation and normalization persistence ([`6be1e0f`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/6be1e0fa65f00c68fae01735b8adab5e385a50a4))
- fail closed on empty catalogue and keep normalized recipes in sync ([`ea2f60e`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/ea2f60ebdbdc5b0211aa885e61e86c40b1b92791))
- guard saved recipe loading during startup ([`9b9c7af`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/9b9c7af36c875148cda82ea455f15c8f286b7d69))
- improve sidebar quick-access defaults ([`f86d350`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/f86d350b9a56f8e982140c2fc1a51eb606e34b39))
- improve sidebar quick-access defaults ([`25e50ae`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/25e50aee69509511979e2c53b622a6bb89bd0d29))
- keep malformed recipes dropped while validating imported args ([`3f9a48c`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/3f9a48c3f1deedf8570334e26f86ae88f70c83b2))
- make HelpDialog modifier labels platform-aware and drop stopPropagation ([`28cbd2e`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/28cbd2eb00f06ed6924619a9526953292f5b262c))
- make keyboard shortcuts work and read correctly on macOS ([`89f72e8`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/89f72e8cc93422282b1ad9bc75e28a39ada52152))
- match non-ASCII text in search, filter and identifier operations ([`7855e63`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/7855e631a55eb771586be4327068fc62a8f5407e))
- match non-ASCII text in search, filter and identifier operations ([`9c24c05`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/9c24c05ca087a53465453300e150693bc4a4c750))
- preserve toggleString values and validate toggle format separately ([`de495b0`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/de495b020c90fd7c9e1e2f91c54720dba50bcfa3))
- read back every IP form change-ip-format writes ([`a0ab2c2`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/a0ab2c2a35294100a0bf9dfa0d74a89e9456065a))
- read back every IP form change-ip-format writes ([`76bbed5`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/76bbed5086d2b0b8eddcc4cbf292c6b2f60787e5))
- revalidate saved recipes once operations load ([`1cc1f10`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/1cc1f106528069dacc060d9dbd5b50fae858c02b))
- Scorecard findings, and bugs found by property-based tests ([`58fc3d6`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/58fc3d621a864d33d623febc67bbcbc5bb664dcf))
- Scorecard findings, and bugs found by property-based tests ([`cb72322`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/cb723228fbffb68fc0484ff1e9907e4ad43355a6))
- stop the CSV detection hang, clear CodeQL alerts, fix the mobile output bar ([`35ba77c`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/35ba77cb3d5a427c2429d47d43d56df76ca0be31))
- stop the CSV detection hang, clear CodeQL alerts, fix the mobile output bar ([`74fdb6d`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/74fdb6d19e32cb78dcee05a138b8e41b90fd8329))
- stop the Search view answering for a half-typed query ([`b04a919`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/b04a919ed04a3e11bdf37eb94595cb7f20750178))
- stop the Search view answering for a half-typed query ([`e3706da`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/e3706da11d3e6466a74d8781e5cdf8f1180ceb20))
- validate imported args against operation defs and enforce export version ([`f059f27`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/f059f277698982bdc076c1bca593e1da0a329ef8))
- validate toggle values and preserve safe arg metadata ([`8b62495`](https://github.com/m4sh-wacker/DecodeBox-SDK/commit/8b62495741526ffd5eb8caaa6b265583a193834b))

## [0.2.0](https://github.com/OWASP/DecodeBox/compare/v0.1.2...v0.2.0) (2026-11-25)

### Added

- add client-side import/export for saved recipes ([`64a6947`](https://github.com/OWASP/DecodeBox/commit/64a6947c6deb7513b5d011b6ffc87e02e4d3c2c4))

### Fixed

- enforce operation-aware import validation and normalization persistence ([`6be1e0f`](https://github.com/OWASP/DecodeBox/commit/6be1e0fa65f00c68fae01735b8adab5e385a50a4))
- fail closed on empty catalogue and keep normalized recipes in sync ([`ea2f60e`](https://github.com/OWASP/DecodeBox/commit/ea2f60ebdbdc5b0211aa885e61e86c40b1b92791))
- guard saved recipe loading during startup ([`9b9c7af`](https://github.com/OWASP/DecodeBox/commit/9b9c7af36c875148cda82ea455f15c8f286b7d69))
- keep malformed recipes dropped while validating imported args ([`3f9a48c`](https://github.com/OWASP/DecodeBox/commit/3f9a48c3f1deedf8570334e26f86ae88f70c83b2))
- preserve toggleString values and validate toggle format separately ([`de495b0`](https://github.com/OWASP/DecodeBox/commit/de495b020c90fd7c9e1e2f91c54720dba50bcfa3))
- revalidate saved recipes once operations load ([`1cc1f10`](https://github.com/OWASP/DecodeBox/commit/1cc1f106528069dacc060d9dbd5b50fae858c02b))
- validate imported args against operation defs and enforce export version ([`f059f27`](https://github.com/OWASP/DecodeBox/commit/f059f277698982bdc076c1bca593e1da0a329ef8))
- validate toggle values and preserve safe arg metadata ([`8b62495`](https://github.com/OWASP/DecodeBox/commit/8b62495741526ffd5eb8caaa6b265583a193834b))

## [0.1.2](https://github.com/OWASP/DecodeBox/compare/v0.1.1...v0.1.2) (2026-11-23)

### Fixed

- make HelpDialog modifier labels platform-aware and drop stopPropagation ([`28cbd2e`](https://github.com/OWASP/DecodeBox/commit/28cbd2eb00f06ed6924619a9526953292f5b262c))
- make keyboard shortcuts work and read correctly on macOS ([`89f72e8`](https://github.com/OWASP/DecodeBox/commit/89f72e8cc93422282b1ad9bc75e28a39ada52152))

## [0.1.1](https://github.com/OWASP/DecodeBox/compare/v0.1.0...v0.1.1) (2026-11-22)

### Fixed

- auto-expand newly created favorites and recent sections ([`7805925`](https://github.com/OWASP/DecodeBox/commit/7805925b543158fe65e4d5486a8b12849bddf431))
- improve sidebar quick-access defaults ([`25e50ae`](https://github.com/OWASP/DecodeBox/commit/25e50aee69509511979e2c53b622a6bb89bd0d29))

## [Unreleased]

Changes planned for the next release will be documented here.

## [0.1.0] - 2026-11-20

Initial public release of OWASP DecodeBox.

### Added

- Added a standalone, self-contained HTML build for offline use.
- Added a DecodeBox screenshot to the README.
- Added a demo video to the README.
- Added GitHub Scorecard workflow configuration.
- Added read-back checks for IP formats written by `change-ip-format`.

### Changed

- Improved automatic IPv4 format detection.
- Improved non-ASCII text matching in search, filtering, and identifier operations.
- Refined project branding and README presentation.
- Updated the project tagline to "Encode. Decode. Identify."
- Set `https://decodebox.owasp.org/` as the official project website.

### Fixed

- Fixed a CSV detection issue that could cause the application to hang.
- Fixed Search view behavior when handling incomplete queries.
- Fixed the mobile output bar.
- Fixed output scrolling behavior.
- Addressed issues identified through property-based testing.
- Resolved reported CodeQL alerts and Scorecard findings.

### Security

- Addressed CodeQL alerts.
- Improved security-related project checks through Scorecard findings and remediation.

### Maintenance

- Updated dependencies through Dependabot monthly maintenance groups.
- Applied dependency updates across multiple ecosystems.

### Contributors

Thanks to everyone who contributed to this release:

- [@m4sh-wacker](https://github.com/m4sh-wacker)
- [@arpitjain099](https://github.com/arpitjain099)
- [Dependabot Bot](https://github.com/apps/dependabot)

---

[0.1.0]: https://github.com/OWASP/DecodeBox/releases/tag/v0.1.0
