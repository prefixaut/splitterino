# Contribute to Splitterino

Contribution to Splitterino is welcome and highly encouraged!
Before contributing, please read through this Document to get a basic understanding of how you should/can contribute!

## Finding Work

Splitterino has a broad spectrum of things you can contribute to.
Therefore, new contributions should be though through and have a clear goal.
Additionally, these changes should be relevant to the core of the Project.

When it is a feature which doesn't directly need to be in the core, it should
probably be planned as a Plugin (Plugin API is starting with `0.3.0`) instead.

If you want to help out, but don't know what you can work on, simply message
one of the maintainers or ask in the discord server. See the [Contact](#contact)
section for more info.

## Workflow

- Create an Issue (if not done yet)
  - Assign yourself to the ticket
- Fork this repository
- Branch off from the `development`-branch
  - Name your branch properly: `<type>/<ticket-number>-<description>`
  - `type`: The type of the ticket, like `feature`, `change`, `bugfix`
  - `ticket-number`: Uhhh ... the ticket number?
  - `description`: The summary/title of the ticket, in lower kebab case
- Commit your changes into the branch with descriptive and meaningful commit messages
- Unit Tests
  - Write unit-tests for your changes/features
  - Fix/Update test which are broken due to your changes
- Create a Pull-Request (to the `development` branch)
- Wait/Ask for a review
  - Fix the requested changes if there're any
- Done!

## Code Quality

- Create clean and readable code 
- Keep up the liniting rules (via TSLint)
- Format your code (via Prettier/TSLint)
- Organize the imports (easiest way is via TypeScript Hero):
  - package-imports first, separated with a new line to the project-imports
  - project-imports, which have to be relative and as direct as possible

## Contact

Currently two people are maintaining splitterino:
- PreFiXAUT
  - Discord: PreFiXAUT#7904
  - E-mail: [mail@prefix.moe](mailto:mail@prefix.moe)
- SirChronus (Chronus):
  - Discord: SirChronus#1921
  - E-mail: [chronus@prefix.moe](mailto:chronus@prefix.moe)

You can also reach the maintainers via the official Splitterino Discord server [here](https://discord.gg/tCxVXcu).
