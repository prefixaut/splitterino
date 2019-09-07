# Contribute to Splitterino

## Development GitLab-Server

The GitHub repository is merely mirroring the `master`-branch from the Development GitLab-Server.

To work on the project effectively, you should contact one of the maintainers to get access and start working.

---

### Reasoning

GitHub is nice an all, but for better organization we have a private GitLab Server running. It has more features regarding management and internal ticket management.

Handling tickets more internally, helps having the GitHub issues clean for bug-reports and doesn't let people think we have 700 issues, while most of them are feature-requests and enhancements.

## Workflow

- Search for a Ticket/Bug you want to work on
  - If you can't find anything, you can ask the maintainers to get one
  - Assign the Ticket to you or let it get assigned to you
- Branch off from the `master`-branch
  - Name your branch properly: `<type>/<ticket-number>-<description>`
  - `type`: The type of the ticket, like `feature`, `change`, `bugfix`
  - `ticket-number`: Uhhh ... the ticket number?
  - `description`: The Summary/Title of the ticket, in lower kebab case
- Keep the code clean:
  - Keep up the liniting rules (via TSLint)
  - Format your code (via Prettier/TSLint)
  - Organize the Imports (easiest via TypeScript Hero):
    - package-imports first, separated with a new line to the project-imports
    - project-imports, which have to be relative and as direct as possible
- Commit your changes into the branch with descriptive and meaningful commit messages
- Attempt to write unit-tests directly
- Make sure the tests are working - otherwise fix them up
