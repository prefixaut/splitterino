# Splitterino

> Currently the Application is heavily under construction and building up a ground-work. Work is done on a private git-server and is synchronized to github (only the `master` branch).
> If you wish to contribute, contact one of the maintainers to get access to the git-server.

Splitterino is an open-source multi-platform applications for speedrunners (gaming-speedrunners) to time their runs with! It's greatly insprired from existing splitters like [LiveSplit](http://livesplit.org/), but is build freshly from the ground up with customization in mind.

Splitterino is build untop [Electron](https://electronjs.org/) and [Vue](https://vuejs.org/), using [TypeScript](https://www.typescriptlang.org/) as the language for a more reliable and stable application.

## Usage

The Application is still under heavy development and is therefore not workable just yet. We are working on an alpha release so that it can be used for experimentation.

## Installation

For package-management, [yarn](https://yarnpkg.com/) is the package-manager of choice for this project.

Install all packages via `yarn` and then serve the Application via Electron.

```
yarn
yarn serve
```

Beware of possible zombie threads when the Application is killed via `Ctrl+C`.

## Contribution

- All changes may only be ***merged*** to master. Therefore create your features/fixes in dedicated branches
- Format your code (via Prettier)
- Organize the Imports (via TypeScript Hero)