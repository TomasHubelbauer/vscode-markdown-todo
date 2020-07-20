# [VSCode MarkDown To-Do](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-todo)
![](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-todo.svg)
![](https://github.com/tomashubelbauer/vscode-markdown-todo/workflows/.github/workflows/main.yml/badge.svg)

Collects to-do items in MarkDown files to an Explorer tree view with contextual menues for toggling and removing to-do items and keeps the tree view up-to-date as to-do items are inserted, updated and deleted in any MarkDown file in the workspace.

![Screenshot](screenshot.gif)

See the [feature rundown](demo\README.md).

## Running

Use the VS Code debug configuration using the `F5` key.

## Debugging

See [Running](#running)

## Testing

`npm test`

CI for this extension is not set up yet.

## Monitoring

The extension contains no remote telemetry of any sort that I've put in. VS Code
might report stuff to Microsoft, but this extension does nothing of the sort on
its own. I will eventually introduce a local telemetry reporter, which will be
opt-in.

# Contributing

- Fork the repository
- Create a branch named after the bug issue you are fixing / feature request issue you are implementing
  - See `todo` if you are implementing a new feature or closing a reported bug
  - See `wiki/vscode-issues.md` if you are fixing debt caused by VS Code API shortcomings
- Test your changes by following along the feature list in the README of the `demo` directory and ensuring no regressions are introduced
- Record the VS Code extension host window (at a reasonable size) using ScreenToGif on the scene set up in the `demo` directory
  - Follow along with the `README` and showcase features as they are listed
- Remove the related file in `todo` and update knowledge base in `wiki` if applicable
- Open a pull request

# Publishing

- Run tests (`npm test`)
- Update version
- Update changelog
- Execute `vsce publish`
  - Execute `vsce login` if the PAT is expired
  - https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token

## To-Do

### Figure out and fix whatever `TodoCodeLens` was meant to be

### Ditch Travis for CI now that we have GitHub Actions

### Introduce local opt-in telemetry reporter (to this and other extensions)

### Write up some tests
