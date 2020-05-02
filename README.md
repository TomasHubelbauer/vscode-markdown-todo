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

This extension uses telemetry for error reporting.

The telemetry reporter respects the VS Code opt-out flag.
[Learn here how to opt out of VS Code telemetry](https://code.visualstudio.com/docs/supporting/FAQ#_how-to-disable-telemetry-reporting).

Azure ApplicationInsights doesn't allow making the events public,
but I will happily invite any concerned users into the AI resource using their MSA
upon request.

I don't collect anything sketchy or track you, I just want to make sure I fix bugs.

# Contributing

See [Contributing](CONTRIBUTING.md).

## To-Do

### Figure out and fix whatever `TodoCodeLens` was meant to be
