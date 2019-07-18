![Travis](https://img.shields.io/travis/prefixaut/splitterino.svg?style=for-the-badge)
![Coverage](https://img.shields.io/codeclimate/coverage/prefixaut/splitterino.svg?style=for-the-badge)
![Release Version](https://img.shields.io/github/release/prefixaut/splitterino.svg?style=for-the-badge)
![License](https://img.shields.io/github/license/prefixaut/splitterino.svg?style=for-the-badge)

# Splitterino

> Currently the application is heavily under construction and building up a ground-work. Work is done on a private git-server and is synchronized to github (only the `master` branch).
> If you wish to contribute, contact one of the maintainers to get access to the git-server.

Splitterino is an open-source multi-platform applications for speedrunners (gaming-speedrunners) to time their runs with! It's greatly insprired from existing splitters like [LiveSplit](http://livesplit.org/), but is build freshly from the ground up with customization in mind.

Splitterino is built untop [Electron](https://electronjs.org/) and [Vue](https://vuejs.org/), using [TypeScript](https://www.typescriptlang.org/) as the language for a more reliable and stable application.

## Usage

The application is still under heavy development and is therefore not workable just yet. We are working on an alpha release so that it can be used for experimentation.

## Installation

### Testing

If you want to try out Splitterino, then you can install some test versions from the [GitHub Releases](https://github.com/prefixaut/splitterino/releases)!

### Develop

For package-management, [yarn](https://yarnpkg.com/) is the package-manager of choice for this project.

Install all packages via `yarn` and then serve the application via Electron.

```
yarn
yarn serve
```

Beware of possible zombie threads when the application is killed via `Ctrl+C`.

## Contribution

- All changes may only be ***merged*** to master. Therefore create your features/fixes in dedicated branches
- Format your code (via Prettier)
- Organize the Imports (via TypeScript Hero)