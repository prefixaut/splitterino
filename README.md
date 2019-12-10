[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fprefixaut%2Fsplitterino%2Fbadge%3Fref%3Dmaster&style=for-the-badge)](https://actions-badge.atrox.dev/prefixaut/splitterino/goto?ref=master)
[![Coverage](https://img.shields.io/codeclimate/coverage/prefixaut/splitterino.svg?style=for-the-badge&logo=code-climate&logoColor=white)](https://codeclimate.com/github/prefixaut/splitterino)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/prefixaut/splitterino?logo=code-climate&logoColor=white&style=for-the-badge)](https://codeclimate.com/github/prefixaut/splitterino)
[![Release Version](https://img.shields.io/github/release/prefixaut/splitterino.svg?style=for-the-badge)](https://github.com/prefixaut/splitterino/releases)
[![License](https://img.shields.io/github/license/prefixaut/splitterino.svg?style=for-the-badge)](https://github.com/prefixaut/splitterino/blob/master/LICENSE)

# Splitterino

Splitterino is an open-source multi-platform applications for speedrunners (gaming-speedrunners) to time their runs with! It's greatly insprired from existing splitters like [LiveSplit](http://livesplit.org/), but is build freshly from the ground up with customization in mind.

Splitterino is built ontop [Electron](https://electronjs.org/) and [Vue](https://vuejs.org/), using [TypeScript](https://www.typescriptlang.org/) as the language for a more reliable and stable application.

## Usage

To install Splitterino to use it, you should use the installer for your operating system.
Download the appropriate installer from the [GitHub Releases](https://github.com/prefixaut/splitterino/releases) page and follow the instructions.

## Installation

This installation is aimed for developers to work on and test the code.

Required Software:
* Node via [NodeJS](https://nodejs.org) or via [NVM - Node Version Manager](https://github.com/nvm-sh/nvm)
* [yarn](https://yarnpkg.com/) as the Package-Manager (instead of `npm`)

First, clone the repository to your local machine.
The rules for contributing are specified in [CONTRIBUTING](https://github.com/prefixaut/splitterino/blob/master/.github/CONTRIBUTING.md)

Then install all packages via `yarn` and then serve the application.

```sh
yarn
yarn serve
```

Beware of possible zombie threads when the application is killed via `Ctrl+C`.