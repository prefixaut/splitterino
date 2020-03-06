# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A completely custom implementation of IPC via ZeroMQ [SPL-26]
- LiveSplit Core integration [SPL-27]

### Changed

- Segments in Split-Files now ommit the `personalBest` and `overallBest` it has no time set [SPL-33]
- The Event-Hub has been reworked to use an inproc IPC socket [SPL-38]
- Components which are configurable will take default values from store and are override-able via props [SPL-37]

## [0.2.1] - 2019-12-10

### Fixed

- Editing Splits as well as Selects didn't trigger a proper change [SPL-35/SPL-36]

## [0.2.0] - 2019-11-28

### Added

- This very Changelog!
- Loadable Templates and Styles.
- Splits comparison to Personal Best (PB) and Overall Best (OB)
- Splits File version handling
- Drag'n'Drop Support for Splits Files
- Statistical Components:
  - Best possible time
  - Sum of best
  - Possible time save
  - Previous segment delta time

### Changed

- IGT implementation
- Time calculations

## [0.1.1] - 2019-10-12

### Added

- Custom logger with pio
- File Assiciations for `.splits` files
- Splits open Prompt
- Game Infos
- Splits Editor
- Settings Editor
- IGT Support

[unreleased]: https://github.com/prefixaut/splitterino/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/prefixaut/splitterino/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/prefixaut/splitterino/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/prefixaut/splitterino/releases/tag/v0.1.1
