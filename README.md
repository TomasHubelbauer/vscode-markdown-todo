# [VSCode MarkDown To-Do](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-todo)
![Installs](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-todo.svg)
![Build](https://api.travis-ci.org/TomasHubelbauer/vscode-markdown-todo.svg?branch=master)

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

See [Contributing](CONTRIBUTING.md).

## To-Do

### Figure out and fix whatever `TodoCodeLens` was meant to be

### Ditch Travis for CI now that we have GitHub Actions

### Introduce local opt-in telemetry reporter (to this and other extensions)
