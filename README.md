[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fprefixaut%2Fsplitterino%2Fbadge%3Fref%3Dmaster&style=for-the-badge)](https://actions-badge.atrox.dev/prefixaut/splitterino/goto?ref=master)
[![Coverage](https://img.shields.io/codeclimate/coverage/prefixaut/splitterino.svg?style=for-the-badge&logo=code-climate&logoColor=white)](https://codeclimate.com/github/prefixaut/splitterino)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/prefixaut/splitterino?logo=code-climate&logoColor=white&style=for-the-badge)](https://codeclimate.com/github/prefixaut/splitterino)
[![Release Version](https://img.shields.io/github/release/prefixaut/splitterino.svg?style=for-the-badge)](https://github.com/prefixaut/splitterino/releases)
[![License](https://img.shields.io/github/license/prefixaut/splitterino.svg?style=for-the-badge)](https://github.com/prefixaut/splitterino/blob/master/LICENSE)

# Splitterino

Splitterino is an open-source multi-platform applications for speedrunners (gaming-speedrunners) to time their runs with! It's greatly insprired from existing splitters like [LiveSplit](http://livesplit.org/), but is build freshly from the ground up with customization in mind.

Splitterino is built ontop [Electron](https://electronjs.org/) and [Vue](https://vuejs.org/), using [TypeScript](https://www.typescriptlang.org/) as the language for a more reliable and stable application.

## Installation

### Regular Users

To install Splitterino to use it, you should use the installer for your operating system.
Download the appropriate installer from the [GitHub Releases](https://github.com/prefixaut/splitterino/releases) page and follow the instructions.

---

### Developers / Contributors

This installation is aimed for developers to work on and test the code.
Please read the rules for contributing which are specified in [CONTRIBUTING.md](./.github/CONTRIBUTING.md).

Required Software:
* [NodeJS](https://nodejs.org), perferably via [NVM - Node Version Manager](https://github.com/nvm-sh/nvm)
* [yarn](https://classic.yarnpkg.com) (Version 1!) as the Package-Manager (instead of `npm`)
* The [Rust](https://rust-lang.org) Programming language

1. Clone the repository to your local machine (Recursive to load the submodules as well):
    ```sh
    git clone --recursive 
    ```
2. Install WebAssembly target to compile `livesplit-core`
    ```sh
    rustup target add wasm32-unknown-unknown
    ```
3. Build wasm-bingen
    ```sh
    cargo install wasm-bindgen-cli
    ```
4. Then install all packages via `yarn`
    ```sh
    yarn
    ```
5. Build the livesplit-core wasm
    ```sh
    yarn build:livesplit-core
    ```
6. Serve the application
    ```sh
    yarn serve
    ```

Beware of possible zombie threads when the application is killed via `Ctrl+C`.